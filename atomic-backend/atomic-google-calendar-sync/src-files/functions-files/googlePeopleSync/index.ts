// import schema from './schema';
import { handlerPath } from '@libs/handler-resolver'

export const googlePeopleSyncAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-contact-sync-admin',
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
  ]
}

export const googlePeopleSyncAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-contact-sync-auth',
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
  ]
}
