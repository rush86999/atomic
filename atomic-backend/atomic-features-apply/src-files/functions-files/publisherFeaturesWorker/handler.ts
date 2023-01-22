import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { formatErrorJSONResponse } from '@libs/api-gateway';


// Set the AWS Region.
const REGION = 'us-east-1' //e.g. 'us-east-1'
// Create SQS service object.
const sqsClient = new SQSClient({ region: REGION })



const publisher  = async (event) => {
  try {

    const eventItem = JSON.parse(event.body)

    const command = new SendMessageCommand({
      QueueUrl: process.env.APPLY_FEATURES_QUEUE_URL,
      MessageBody: JSON.stringify(eventItem),
    })
    
    const response = await sqsClient.send(command)
    console.log(response, ' response')
    
    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'event added to queue',
        event,
      }),
    }
    
  } catch(e) {
    console.log(e, ' unable to process message');

    console.log(formatErrorJSONResponse({
      message: `error processing queue mesages: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    }))
  }
}

export const main = publisher;
