import { formatErrorJSONResponse } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { streamToString } from '@libs/api-helper';
import { bucketName, bucketRegion } from '@libs/constants';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';


import { Readable } from 'stream';
import { GetOptaPlanBodyForCalendarType } from './types';
import { EventPlannerResponseBodyType, OnOptaPlanBodyType, TimeSlotType, UserPlannerRequestBodyType } from '../../libs/types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

// Set the AWS Region.
const REGION = 'us-east-1' //e.g. 'us-east-1'
const s3Client = new S3Client({
  region: bucketRegion,
})

// Create SQS service object.
const sqsClient = new SQSClient({ region: REGION })

const processGetOpaPlanBody = async (
  body: GetOptaPlanBodyForCalendarType,
  timeslotList: TimeSlotType[],
  eventPartList: EventPlannerResponseBodyType[],
  userList: UserPlannerRequestBodyType[],
) => {
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

    const command = new SendMessageCommand({
      QueueUrl: process.env.POST_PROCESS_CALENDAR_QUEUE_URL,
      MessageBody: JSON.stringify({ fileKey: `${hostId}/${singletonId}.json` }),
    })
    console.log(`${hostId}/${singletonId}.json`, ' fileKey')
    const response = await sqsClient.send(command)
    console.log(response, ' response successfully added to queue inside publishToCalendarQueue')
  } catch (e) {
    console.log(e, ' processCalendarForOptaPlanner')
  }
}


const postProcessCalendarOptaPlan = async (event) => {
  try {
    console.log(event, ' event')
    // hasura trigger
    const bodyOptaPlan: OnOptaPlanBodyType = JSON.parse(event.body)
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
    return formatJSONResponse({
      message: 'success',
    })
  } catch (e) {
    console.log(e, ' postProcessCalendarOptaPlan')
    return formatErrorJSONResponse({
      message: e.message,
    })
  }
}

export const main = postProcessCalendarOptaPlan


