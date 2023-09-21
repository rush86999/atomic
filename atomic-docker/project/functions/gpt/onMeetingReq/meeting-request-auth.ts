import { Request, Response } from 'express'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { bucketName, kafkaGPTGroupId, kafkaMeetingReqTemplateTopic, kafkaOnDayScheduleTopic } from '../_libs/constants'
import { v4 as uuid } from 'uuid'
import { CreateDayScheduleBodyType, MeetingRequestBodyType } from '../_libs/types'
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


const processMeetingReqBody = async (
    body: MeetingRequestBodyType
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
            topic: kafkaMeetingReqTemplateTopic,
            messages: [{ value: JSON.stringify({ fileKey: `${userId}/${singletonId}.json` })}]
        })

        const admin = kafka.admin()

        await admin.connect()
        const partitions = await admin.fetchOffsets({ groupId: kafkaGPTGroupId, topics: [kafkaMeetingReqTemplateTopic] })
        console.log(partitions)
        await admin.disconnect()

        await transaction.sendOffsets({
            consumerGroupId: kafkaGPTGroupId, topics: [{ topic: kafkaMeetingReqTemplateTopic, partitions: partitions?.[0]?.partitions}]
        })

        await transaction.commit()

        console.log(response, ' response successfully added to queue inside meetingReqAdmin')

    } catch (e) {
        console.log(e, ' unable to process meeting req body')
    }
  }
