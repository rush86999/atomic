import type { AWS } from '@serverless/typescript';
import type { Lift } from 'serverless-lift'

import postOptaCalWorker from '@functions/postOptaCalWorker';
import authorizerFunc from '@functions/authorizerFunc'
import { onPostOptaCalAdmin, onPostOptaCalAuth } from '@functions/onPostOptaCal'

const serverlessConfiguration: AWS & Lift = {
  service: 'atomic-post-process-calendar',
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
      GOOGLE_CLIENT_SECRET_WEB: '${self:custom.secrets.googleClientSecretWeb}',
      ZOOM_CLIENT_SECRET: '${self:custom.secrets.zoomClientSecret}',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      API_TOKEN: '${self:custom.secrets.apiToken}',
      POST_PROCESS_CALENDAR_QUEUE_URL: '${construct:post-calendar-queue.queueUrl}',
    },
  },
  constructs: {
    'post-calendar-queue': {
      type: 'queue',
      worker: postOptaCalWorker,
      batchSize: 1,
      delay: 9,
    },
  },
  lift: {
    automaticPermissions: true,
  },
  // import the function via paths
  functions: {
    authorizerFunc,
    onPostOptaCalAdmin,
    onPostOptaCalAuth,
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
