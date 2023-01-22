import { handlerPath } from '@libs/handler-resolver'

export const googleCalendarWatchAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  // environment: {
  //   CALENDAR_QUEUE_URL: '${construct:calendar-queue.queueUrl}',
  //   CALENDAR_QUEUE_BASIC_URL: '${construct:calendar-queue-lite.queueUrl}',
  // },
  events: [
    {
      http: {
        method: 'post',
        path: 'google-calendar-watch-admin',
        // request: {
        //   schemas: {
        //     'application/json': schema
        //   }
        // },
        cors: true,
        authorizer: {
          name: 'authorizerFunc'
        }
      }
    }
  ],
  // role: 'LambdaOpenSearchAccessRole'
}

export const googleCalendarWatchAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-calendar-watch-auth',
        // request: {
        //   schemas: {
        //     'application/json': schema
        //   }
        // },
        cors: true,
        authorizer: {
          arn: 'YOUR-AWS-COGNITO-ARN'
        }
      }
    }
  ],
  // role: 'LambdaOpenSearchAccessRole'
}
