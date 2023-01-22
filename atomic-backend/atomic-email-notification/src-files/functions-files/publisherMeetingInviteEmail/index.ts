import schema from './schema'
import { handlerPath } from '@libs/handler-resolver'

export const publisherMeetingInviteAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'meeting-invite-auth',
        request: {
          schemas: {
            'application/json': schema
          }
        },
        cors: true,
        authorizer: {
          arn: 'arn:aws:cognito-idp:us-east-1:767299747852:userpool/us-east-1_b7dqUxHIl'
        }
      }
    }
  ],
}

export const publisherMeetingInviteAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'meeting-invite-admin',
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

