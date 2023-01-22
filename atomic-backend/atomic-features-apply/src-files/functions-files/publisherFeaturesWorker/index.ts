import schema from './schema'
import { handlerPath } from '@libs/handler-resolver'

export const publisherFeaturesWorkerAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'features-worker-to-queue-auth',
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

export const publisherFeaturesWorkerAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'features-worker-to-queue-admin',
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

