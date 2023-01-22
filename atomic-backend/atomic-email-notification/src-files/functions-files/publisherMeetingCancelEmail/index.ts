import schema from './schema'
import { handlerPath } from '@libs/handler-resolver'

export const publisherMeetingCancelAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'meeting-cancel-auth',
        request: {
          schemas: {
            'application/json': schema
          }
        },
        cors: true,
        authorizer: {
          arn: 'YOUR-AWS-COGNITO-ARN'
        }
      }
    }
  ],
}

export const publisherMeetingCancelAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'meeting-cancel-admin',
        request: {
          schemas: {
            'application/json': schema
          }
        },
        cors: true,
        authorizer: {
          name: 'authorizerFunc'
        }
      }
    }
  ],
}

