import { handlerPath } from '@libs/handler-resolver'

export const eventsSearchAdmin = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'events-search-admin',
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
  // environment: {
  //   // OPENSEARCH_ENDPOINT: {
  //   //   'Fn::GetAtt': ['OpenSearchServiceDomain', 'DomainEndpoint']
  //   // }
  // },
  // role: 'LambdaOpenSearchAccessRole'
}

export const eventsSearchAuth = {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'events-search-auth',
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
  // environment: {
  //   // OPENSEARCH_ENDPOINT: {
  //   //   'Fn::GetAtt': ['OpenSearchServiceDomain', 'DomainEndpoint']
  //   // }
  // },
  // role: 'LambdaOpenSearchAccessRole'
}
