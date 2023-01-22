import type { AWS } from '@serverless/typescript';
import type { Lift } from 'serverless-lift'

import applyFeaturesWorker from '@functions/applyFeaturesWorker';
import authorizerFunc from '@functions/authorizerFunc'
import { publisherFeaturesWorkerAdmin, publisherFeaturesWorkerAuth } from '@functions/publisherFeaturesWorker'


const serverlessConfiguration: AWS & Lift = {
  service: 'atomic-features-apply',
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
      OPTAPLANNER_URL: '${self:custom.resources.optaPlannerUrl}',
      OPTAPLANNER_USERNAME: '${self:custom.secrets.optaPlannerUser}',
      OPTAPLANNER_PASSWORD: '${self:custom.secrets.optaPlannerPass}',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      API_TOKEN: '${self:custom.secrets.apiToken}',
      OPENSEARCH_ENDPOINT: '${self:custom.resources.openSearchDomainEndPoint}',
      APPLY_FEATURES_QUEUE_URL: '${construct:apply-features-queue.queueUrl}',
    },
  },
  constructs: {
    'apply-features-queue': {
      type: 'queue',
      worker: applyFeaturesWorker,
      batchSize: 1,
      delay: 9,
    },
  },
  lift: {
    automaticPermissions: true,
  },
  // import the function via paths
  functions: { 
    publisherFeaturesWorkerAdmin,
    publisherFeaturesWorkerAuth,
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
