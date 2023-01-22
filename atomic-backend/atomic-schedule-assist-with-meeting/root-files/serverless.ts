import type { AWS } from '@serverless/typescript';
import type { Lift } from 'serverless-lift'

import scheduleMeetingWorker from '@functions/scheduleMeetingWorker'
import authorizerFunc from '@functions/authorizerFunc'
import { publisherScheduleMeetingAdmin, publisherScheduleMeetingAuth } from '@functions/publisherScheduleMeeting'

const serverlessConfiguration: AWS & Lift = {
  service: 'atomic-schedule-meeting',
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
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      OPTAPLANNER_USERNAME: '${self:custom.secrets.optaPlannerUser}',
      OPTAPLANNER_PASSWORD: '${self:custom.secrets.optaPlannerPass}',
    },
  },
  constructs: {
    'schedule-meeting-queue': {
      type: 'queue',
      worker: scheduleMeetingWorker,
      batchSize: 1,
      delay: 9,
      maxRetries: 3
    },
  },
  lift: {
    automaticPermissions: true,
  },
  // import the function via paths
  functions: {
    publisherScheduleMeetingAdmin,
    publisherScheduleMeetingAuth,
    authorizerFunc,
  },
  package: { individually: true },
  custom: {
    secrets: '${file(secrets.json)}',
    resources: '${file(resources.json)}',
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
