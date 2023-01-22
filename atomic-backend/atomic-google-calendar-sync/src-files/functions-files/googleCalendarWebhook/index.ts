import { handlerPath } from '@libs/handler-resolver'

export const googleCalendarWebhookPublic = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout: 30,
  events: [
    {
      http: {
        method: 'post',
        path: 'google-calendar-webhook-public',
        // request: {
        //   schemas: {
        //     'application/json': schema
        //   }
        // },
        cors: true,
        // authorizer: {
        //   name: 'authorizerFunc'
        // }
      }
    }
  ],
  // role: 'LambdaOpenSearchAccessRole'
}
