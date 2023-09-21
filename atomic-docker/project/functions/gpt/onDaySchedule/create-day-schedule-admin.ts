import { Request, Response } from 'express'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { bucketName, kafkaGPTGroupId, kafkaOnDayScheduleTopic } from '../_libs/constants'
import { v4 as uuid } from 'uuid'
import { CreateDayScheduleBodyType } from '../_libs/types'
import { Kafka, logLevel } from 'kafkajs'
import ip from 'ip'


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


 const processDayScheduleBody = async (
    body: CreateDayScheduleBodyType
  ) => {
    const producer = kafka.producer({ maxInFlightRequests: 1, idempotent: true })
    await producer.connect()

    const  transaction = await producer.transaction()

    try {
      
        const userId = body?.userId
        const singletonId = uuid()
    
  
        const params = {
            Body: JSON.stringify({
            ...body,
            }),
            Bucket: bucketName,
            Key: `${userId}/${singletonId}.json`,
            ContentType: 'application/json',
        }
    
        const s3Command = new PutObjectCommand(params)
    
        const s3Response = await s3Client.send(s3Command)
        console.log(s3Response, ' s3Response')

        const response = await transaction.send({
            topic: kafkaOnDayScheduleTopic,
            messages: [{ value: JSON.stringify({ fileKey: `${userId}/${singletonId}.json` })}]
        })

        const admin = kafka.admin()

        await admin.connect()
        const partitions = await admin.fetchOffsets({ groupId: kafkaGPTGroupId, topics: [kafkaOnDayScheduleTopic] })
        console.log(partitions)
        await admin.disconnect()

        await transaction.sendOffsets({
            consumerGroupId: kafkaGPTGroupId, topics: [{ topic: kafkaOnDayScheduleTopic, partitions: partitions?.[0]?.partitions}]
        })

        await transaction.commit()

        console.log(response, ' response successfully added to queue inside publishToCalendarQueue')
    } catch (e) {
      console.log(e, ' processCalendarForOptaPlanner')
      await transaction.abort()
    }
  }


 const handler = async (req: Request, res: Response) => {
    try {
        const reqBody: CreateDayScheduleBodyType = req.body

    // validate
    if (!reqBody?.userId) {
      return res.status(400).json({
        message: 'no userId present',
        event: reqBody,
      })
    }

    if (!(reqBody?.tasks?.length > 0)) {
      return res.status(400).json({
        message: 'no tasks present',
        event: reqBody,
      })
    }

    if (!reqBody?.startDate) {
      return res.status(400).json({
        message: 'no startDate present',
        event: reqBody,
      })
    }

    if (!reqBody?.endDate) {
      return res.status(400).json({
        message: 'no endDate present',
        event: reqBody,
      })
    }

    if (!reqBody?.timezone) {
      return res.status(400).json({
        message: 'no timezone present',
        event: reqBody,
      })
    }

    if (!reqBody?.tasks) {
      return res.status(400).json({
        message: 'no tasks present',
        event: reqBody,
      })
    }

    await processDayScheduleBody(
      reqBody,
    )
        res.status(202).send('succesfully created day schedule')
    } catch (e) {
        console.log(e, ' unable to create day schedule')
        res.status(400).json(e)
    }
 }

 export default handler