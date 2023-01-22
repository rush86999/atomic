import type { AWS } from '@serverless/typescript';

import deleteUserAccount from '@functions/deleteUserAccount';

const serverlessConfiguration: AWS = {
  service: 'deleteaccount',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: 'prod',
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:AdminDeleteUser'],
            Resource: '*',
          }
        ]
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      HASURA_ADMIN_SECRET: '${self:custom.secrets.hasuraSecret}',
      APPLE_CLIENT_ID: '${self:custom.secrets.appleClientId}',
      APPLE_CLIENT_SECRET: '${self:custom.secrets.appleClientSecret}',
    },
  },
  // import the function via paths
  functions: { deleteUserAccount },
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
      }
    }
  }
};

module.exports = serverlessConfiguration;
