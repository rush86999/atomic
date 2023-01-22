import type { AWS } from '@serverless/typescript';
import type { Lift } from 'serverless-lift'

import scheduleEventWorker from '@functions/scheduleEventWorker';
import scheduleEventShortWorker from '@functions/scheduleEventShortWorker'
import authorizerFunc from '@functions/authorizerFunc'
import { publisherScheduleEventAdmin, publisherScheduleEventAuth } from '@functions/publisherScheduleEvent'
import { publisherScheduleShortEventAdmin, publisherScheduleShortEventAuth } from '@functions/publisherScheduleShortEvent'

const serverlessConfiguration: AWS & Lift = {
  service: 'atomic-schedule-event',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-lift'],
  provider: {
    name: 'aws',
    stage: 'prod',
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: 'sqs:*',
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: 's3:*',
            Resource: '*'
          },
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
      OPTAPLANNER_USERNAME: '${self:custom.secrets.optaPlannerUser}',
      OPTAPLANNER_PASSWORD: '${self:custom.secrets.optaPlannerPass}',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      API_TOKEN: '${self:custom.secrets.apiToken}',
      EVENT_QUEUE_URL: '${construct:event-queue.queueUrl}',
      EVENT_SHORT_QUEUE_URL: '${construct:event-short-queue.queueUrl}',
    },
  },
  constructs: {
    'event-queue': {
      type: 'queue',
      worker: scheduleEventWorker,
      batchSize: 1,
      delay: 9,
    },
    'event-short-queue': {
      type: 'queue',
      worker: scheduleEventShortWorker,
      batchSize: 1,
      delay: 9,
    },
  },
  // import the function via paths
  functions: { 
    publisherScheduleEventAdmin,
    publisherScheduleEventAuth,
    authorizerFunc,
    publisherScheduleShortEventAdmin,
    publisherScheduleShortEventAuth,
  },
  lift: {
    automaticPermissions: true,
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
