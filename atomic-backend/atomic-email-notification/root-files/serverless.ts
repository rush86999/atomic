import type { AWS } from '@serverless/typescript';

import authorizerFunc from '@functions/authorizerFunc'
import { publisherMeetingInfoHostAdmin, publisherMeetingInfoHostAuth } from '@functions/publisherMeetingInfoHost'
import { publisherMeetingInviteAdmin, publisherMeetingInviteAuth } from '@functions/publisherMeetingInviteEmail'
import { publisherMeetingCancelAdmin, publisherMeetingCancelAuth } from '@functions/publisherMeetingCancelEmail'

const serverlessConfiguration: AWS = {
  service: 'atomic-email-notification',
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
            Action: 'ses:*',
            Resource: '*',
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
      API_TOKEN: '${self:custom.secrets.apiToken}',
    },
  },
  // import the function via paths
  functions: {
    publisherMeetingInfoHostAdmin,
    publisherMeetingInfoHostAuth,
    authorizerFunc,
    publisherMeetingInviteAdmin,
    publisherMeetingInviteAuth,
    publisherMeetingCancelAdmin,
    publisherMeetingCancelAuth,
  },
  package: { individually: true },
  custom: {
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
