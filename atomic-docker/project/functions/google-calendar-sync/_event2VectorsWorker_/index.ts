
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'


import { bucketName, kafkaGoogleCalendarSyncGroupId, kafkaGoogleCalendarSyncTopic, openAllEventVectorName } from '@google_calendar_sync/_libs/constants';
import { Readable } from 'stream';
import { Event2VectorBodyType, BulkImportBodyType } from '../_libs/types/event2Vectors/types';
import { bulkDeleteDocInAllEventIndexInOpenSearch, bulkDeleteDocInTrainEventIndexInOpenSearch, bulkPutDataInAllEventIndexInOpenSearch, convertEventTitleToOpenAIVector } from '../_libs/event2VectorsWorker/api-helper';
import { dayjs } from '@google_calendar_sync/_libs/date-utils';
import { Kafka, logLevel } from 'kafkajs'
import ip from 'ip'
import { createDaySchedule } from '@/gpt/_libs/api-helper';
import { CreateDayScheduleBodyType } from '@/gpt/_libs/types';
import { streamToString } from '../_libs/api-helper';

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

export const event2VectorBody = async (body: Event2VectorBodyType) => {
  try {

    const bulkImports: BulkImportBodyType[] = []

    for (const eventObject of body?.events) {

      if (eventObject?.method === 'upsert') {

        const { event } = eventObject

        let text = ''

        if (event?.description) {
          text += `${event?.summary}:${event?.description} \n`
        } else {
          text += `${event?.summary}`
        }

        const vector = await convertEventTitleToOpenAIVector(text)
        const startDate = dayjs(event?.start?.dateTime?.slice(0, 19) || event?.start?.date?.slice(0, 19)).tz(event?.start?.timeZone, true).format()
        const endDate = dayjs(event?.end?.dateTime?.slice(0, 19) || event?.start?.date?.slice(0, 19)).tz(event?.start?.timeZone, true).format()
        // await putDataInAllEventIndexInOpenSearch(`${event?.id}#${eventObject?.calendarId}`, vector, body?.userId, startDate, endDate)
        const bulkImport: BulkImportBodyType = {
          id: `${event?.id}#${eventObject?.calendarId}`,
          body: { [openAllEventVectorName]: vector, userId: body?.userId, start_date: startDate, end_date: endDate }
        }

        bulkImports.push(bulkImport)
      }
    }

    if (bulkImports?.length > 0) {
      await bulkPutDataInAllEventIndexInOpenSearch(bulkImports)
    }

    const ids: string[] = []
    for (const eventObject of body?.events) {

      if (eventObject?.method === 'delete') {
        const { event } = eventObject
      
        // await deleteDocInAllEventIndexInOpenSearch(`${event?.id}#${eventObject?.calendarId}`)
        ids.push(`${event?.id}#${eventObject?.calendarId}`)
        
      }
      
    }

    if (ids?.length > 0) {
      await bulkDeleteDocInAllEventIndexInOpenSearch(ids)
      await bulkDeleteDocInTrainEventIndexInOpenSearch(ids)
    }

  } catch (e) {
    console.log(e, ' unable to event2vectorBody')
  }
}

export const processQueueMessage = async (body: Event2VectorBodyType) => {
  try {
    console.log(body, ' body')

    if (!body?.events?.[0]?.event?.id) {
      throw new Error('no events available')
    }

    return event2VectorBody(body)
  } catch (e) {
    console.log(e, ' unable to process queue message')
  }
}

const queueWorker = async (event) => {
  try {

    const consumer = kafka.consumer({ groupId: kafkaGoogleCalendarSyncGroupId })
    await consumer.connect()

    await consumer.subscribe({ topic: kafkaGoogleCalendarSyncTopic })

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
      
            const body: Event2VectorBodyType = JSON.parse(bodyString)
            console.log(body, ' body')
      
            const s3DeleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileKey,
            })
            const s3DeleteCommandOutput = await s3Client.send(s3DeleteCommand)
            console.log(s3DeleteCommandOutput, ' s3DeleteCommandOutput')
            
            return processQueueMessage(body)
        },
    })
   
  } catch (e) {
    console.log(e, ' unable to event to vector')
  }
};

export default queueWorker

