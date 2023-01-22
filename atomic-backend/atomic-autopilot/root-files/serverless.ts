import type { AWS } from '@serverless/typescript';

import { startDailyAssistAuth, startDailyAssistAdmin } from '@functions/startDailyAssist'
import { addDailyFeaturesAuth, addDailyFeaturesAdmin } from '@functions/addDailyFeatures'
import { onDailyFeaturesAuth, onDailyFeaturesAdmin } from '@functions/onDailyFeatures'
import { onDailyAssistAuth, onDailyAssistAdmin } from '@functions/onDailyAssist'
import { deleteScheduledEventAuth, deleteScheduledEventAdmin } from '@functions/deleteScheduledEvent'
import authorizerFunc from '@functions/authorizerFunc'

const serverlessConfiguration: AWS = {
  service: 'atomic-autopilot',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    stage: 'prod',
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
    timeout: 30,
    runtime: 'nodejs16.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      API_TOKEN: '${self:custom.secrets.apiToken}'
    },
  },
  // import the function via paths
  functions: { 
    startDailyAssistAuth, 
    startDailyAssistAdmin,
    addDailyFeaturesAuth,
    addDailyFeaturesAdmin,
    onDailyFeaturesAuth,
    onDailyFeaturesAdmin,
    onDailyAssistAuth, 
    onDailyAssistAdmin,
    authorizerFunc,
    deleteScheduledEventAuth, 
    deleteScheduledEventAdmin,
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
    },
  },
};

module.exports = serverlessConfiguration;
