import { Request, Response } from 'express'

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { streamToString } from '@post_process_calendar/_libs/api-helper';
import { bucketName, kafkaPostProcessCalGroupId, kafkaPostProcessCalTopic } from '@post_process_calendar/_libs/constants';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';


import { Readable } from 'stream';
import { GetOptaPlanBodyForCalendarType } from '@post_process_calendar/_libs/types/onPostOptaCal/types';
import { EventPlannerResponseBodyType, OnOptaPlanBodyType, TimeSlotType, UserPlannerRequestBodyType } from '@post_process_calendar/_libs/types';
import { Kafka, logLevel } from 'kafkajs'
import ip from 'ip'


dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

// Set the AWS Region.
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
 })



const kafka = new Kafka({
    logLevel: logLevel.DEBUG,
    brokers: [`kafka1:29092`],
    clientId: 'atomic',
    // ssl: true,
    sasl: {
        mechanism: 'plain', // scram-sha-256 or scram-sha-512
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      },
})

const processGetOpaPlanBody = async (
  body: GetOptaPlanBodyForCalendarType,
  timeslotList: TimeSlotType[],
  eventPartList: EventPlannerResponseBodyType[],
  userList: UserPlannerRequestBodyType[],
) => {

    const producer = kafka.producer({ maxInFlightRequests: 1, idempotent: true })
    await producer.connect()

    const  transaction = await producer.transaction()
  try {
    const singletonId = body.singletonId
    const hostId = body?.hostId
    const eventParts = body.eventParts
    const allEvents = body.allEvents
    const hostTimezone = body.hostTimezone
    const newHostBufferTimes = body?.newHostBufferTimes
    const newHostReminders = body?.newHostReminders
    const breaks = body?.breaks
    const oldEvents = body?.oldEvents
    const oldAttendeeEvents = body?.oldAttendeeEvents


    /**
     * TODO:
     * 1. get the opta plan
     * 2. if hard score != 0 recurse until 5 times
     * 3. still hard score != 0 send message to queue
     * 4. if hard score == 0, send message to queue
     */

    const params = {
      Body: JSON.stringify({
        eventParts,
        allEvents,
        newHostBufferTimes,
        newHostReminders,
        breaks,
        plannerBodyResponse: {
          timeslotList,
          userList,
          eventPartList,
        },
        oldEvents,
        oldAttendeeEvents,
        hostTimezone,
      }),
      Bucket: bucketName,
      Key: `${hostId}/${singletonId}.json`,
      ContentType: 'application/json',
    }

    const s3Command = new PutObjectCommand(params)

    const s3Response = await s3Client.send(s3Command)
    console.log(s3Response, ' s3Response')

    const response = await transaction.send({
        topic: kafkaPostProcessCalTopic,
        messages: [{ value: JSON.stringify({ fileKey: `${hostId}/${singletonId}.json` })}]
    })

    const admin = kafka.admin()

    await admin.connect()
    const partitions = await admin.fetchOffsets({ groupId: kafkaPostProcessCalGroupId, topics: [kafkaPostProcessCalTopic] })
    console.log(partitions)
    await admin.disconnect()

    await transaction.sendOffsets({
        consumerGroupId: kafkaPostProcessCalGroupId, topics: [{ topic: kafkaPostProcessCalTopic, partitions: partitions?.[0]?.partitions}]
    })

    await transaction.commit()

    console.log(response, ' response successfully added to queue inside publishToCalendarQueue')
  } catch (e) {
    console.log(e, ' processCalendarForOptaPlanner')
  }
}


const handler = async (req: Request, res: Response) => {
  try {
    console.log(req, ' event')
    // hasura trigger
    const bodyOptaPlan: OnOptaPlanBodyType = req.body
    console.log(bodyOptaPlan, ' bodyOptaPlan')

    const timeslotList = bodyOptaPlan?.timeslotList
    const userList = bodyOptaPlan?.userList
    const eventPartList = bodyOptaPlan?.eventPartList
    const fileKey = bodyOptaPlan?.fileKey
    const hostId = bodyOptaPlan?.hostId

    if (!hostId) {
      throw new Error('userId is not provided')
      return null
    }

    if (!fileKey) {
      throw new Error('no fileKey found')
      return null
    }

    if (!timeslotList) {
      throw new Error('no timeslotList found')
      return null
    }

    if (!eventPartList) {
      throw new Error('no eventPartList found')
      return null
    }


    console.log(fileKey, ' fileKey')
    const s3GetCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })

    const s3GetCommandOutput = await s3Client.send(s3GetCommand)
    const bodyString = await streamToString(s3GetCommandOutput.Body as Readable)
    const body: GetOptaPlanBodyForCalendarType = JSON.parse(bodyString)
    console.log(body, ' body')

    const s3DeleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    })
    const s3DeleteCommandOutput = await s3Client.send(s3DeleteCommand)
    console.log(s3DeleteCommandOutput, ' s3DeleteCommandOutput')

    console.log(body, ' body')
    if (!body?.hostId) {
      throw new Error('hostId is required')
    } else if (!body?.singletonId) {
      throw new Error('singletonId is required')
    } else if (!body?.eventParts?.[0]?.eventId) {
      throw new Error('eventParts is required')
    } else if (!body?.allEvents?.[0]?.id) {
      throw new Error('allEvents is required')
    }

    await processGetOpaPlanBody(
      body,
      timeslotList,
      eventPartList,
      userList,
    )
    return res.status(202).json({
      message: 'success',
    })
  } catch (e) {
    console.log(e, ' postProcessCalendarOptaPlan')
    return res.status(400).json({
      message: e.message,
    })
  }
}

export default handler


