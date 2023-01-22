import { handlerPath } from '@libs/handler-resolver'

export const googleCalendarSyncAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 30,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-calendar-sync-admin',
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

export const googleCalendarSyncAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 30,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-calendar-sync-auth',
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
