import schema from './schema'
import { handlerPath } from '@libs/handler-resolver'

export const deleteZoomMeetAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'delete-zoom-meet-auth',
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

export const deleteZoomMeetAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'delete-zoom-meet-admin',
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

