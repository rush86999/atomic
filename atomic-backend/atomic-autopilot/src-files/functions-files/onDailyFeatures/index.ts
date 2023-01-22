
import { handlerPath } from '@libs/handler-resolver'

export const onDailyFeaturesAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'on-schedule-daily-features-apply-auth',
        cors: true,
        authorizer: {
          arn: 'YOUR-AWS-COGNITO-ARN'
        }
      }
    }
  ],
}

export const onDailyFeaturesAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,

  events: [
    {
      http: {
        method: 'post',
        path: 'on-schedule-daily-features-apply-admin',
        cors: true,
        authorizer: {
          name: 'authorizerFunc'
        }
      }
    }
  ],
}

