import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { bucketName, kafkaGPTGroupId, kafkaMeetingReqTemplateTopic, kafkaOnDayScheduleTopic } from '../_libs/constants'
import { Kafka, logLevel } from 'kafkajs'
import ip from 'ip'
import { Readable } from 'node:stream'
import { meetingRequest, streamToString } from '../_libs/api-helper'
import { MeetingRequestBodyType } from '../_libs/types'

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


const meetingRequestHandler = async () => {
    try {
        const consumer = kafka.consumer({ groupId: kafkaGPTGroupId })
        await consumer.connect()

        await consumer.subscribe({ topic: kafkaMeetingReqTemplateTopic })

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log({
                    key: message?.key?.toString(),
                    value: message?.value?.toString(),
                    headers: message?.headers,
                })
                // '{"fileKey":"fc5df674-b4ee-43c7-ad9e-298ae0eb6208/aed7b93e-8da4-447c-83e7-f0f0f1420226.json"}'
                const bodyData = JSON.parse(message?.value?.toString())
                const fileKey = bodyData.fileKey
                console.log(bodyData, ' bodyData')
                const s3GetCommand = new GetObjectCommand({
                  Bucket: bucketName,
                  Key: fileKey,
                })
          
                const s3GetCommandOutput = await s3Client.send(s3GetCommand)
                const bodyString = await streamToString(s3GetCommandOutput.Body as Readable)
          
                const body: MeetingRequestBodyType = JSON.parse(bodyString)
                console.log(body, ' body')
          
                const s3DeleteCommand = new DeleteObjectCommand({
                  Bucket: bucketName,
                  Key: fileKey,
                })
                const s3DeleteCommandOutput = await s3Client.send(s3DeleteCommand)
                console.log(s3DeleteCommandOutput, ' s3DeleteCommandOutput')
                return meetingRequest(
                    body?.userId,
                    body?.email,
                    body?.shareAvailability,
                    body?.receiver,
                    body?.sender,
                    body?.receiverCharacteristics,
                    body?.receiverGoals,
                    body?.senderCharacteristics,
                    body?.senderGoals,
                    body?.windowStartDate,
                    body?.windowEndDate,
                    body?.senderTimezone,
                    body?.receiverTimezone,
                    body?.slotDuration,
                  )

            },
        })
    } catch (e) {
        console.log(e, ' unable to create meeting request')
    }
}

export default meetingRequestHandler
