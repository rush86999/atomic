import schema from './schema'
import { handlerPath } from '@libs/handler-resolver'

export const createZoomMeetAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'create-zoom-meet-auth',
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

export const createZoomMeetAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'create-zoom-meet-admin',
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

