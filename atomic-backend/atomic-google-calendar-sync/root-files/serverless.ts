import type { AWS } from '@serverless/typescript';


import { googleCalendarSyncAdmin, googleCalendarSyncAuth } from '@functions/googleCalendarSync'
import { googleCalendarWatchAdmin, googleCalendarWatchAuth } from '@functions/googleCalendarWatch'
import { googleCalendarWebhookPublic } from '@functions/googleCalendarWebhook'
import { googlePeopleSyncAdmin, googlePeopleSyncAuth } from '@functions/googlePeopleSync'
import authorizerFunc from '@functions/authorizerFunc'

const serverlessConfiguration: AWS = {
  service: 'atomic-google-calendar-sync',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    stage: 'prod',
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: 'es:*',
            Resource: '*'
          }
        ]
      }
    },
    httpApi: {
      authorizers: {
        customAuthorizer: {
          type: 'request',
          functionName: 'authorizerFunc',
          resultTtlInSeconds: 0,
          identitySource: '$request.header.Authorization',
        }
      }
    },
    runtime: 'nodejs16.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      GOOGLE_CLIENT_SECRET_WEB: '${self:custom.secrets.googleClientSecretWeb}',
      ZOOM_CLIENT_SECRET: '${self:custom.secrets.zoomClientSecret}',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      API_TOKEN: '${self:custom.secrets.apiToken}',
    },
  },
  // import the function via paths
  functions: {
    googleCalendarSyncAdmin,
    googleCalendarSyncAuth,
    googleCalendarWatchAdmin,
    googleCalendarWatchAuth,
    googleCalendarWebhookPublic,
    googlePeopleSyncAdmin,
    googlePeopleSyncAuth,
    authorizerFunc,
  },
  package: { individually: true },
  custom: {
    secrets: '${file(secrets.json)}',
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'*'"
          },
          ResponseType: 'DEFAULT_4XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi',
          },
        },
      },
    }
  }
};

module.exports = serverlessConfiguration;
