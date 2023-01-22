
import { formatErrorJSONResponse } from '../../libs/api-gateway';

const apiToken = process.env.API_TOKEN

function buildAllowAllPolicy(event: any, principalId: string) {
  var tmp = event.methodArn.split(':')
  var apiGatewayArnTmp = tmp[5].split('/')
  var awsAccountId = tmp[4]
  var awsRegion = tmp[3]
  var restApiId = apiGatewayArnTmp[0]
  var stage = apiGatewayArnTmp[1]
  var apiArn = 'arn:aws:execute-api:' + awsRegion + ':' + awsAccountId + ':' +
    restApiId + '/' + stage + '/*/*'
  const policy = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: [apiArn]
        }
      ]
    }
  }
  return policy
}

const authorizer = async (event: { [x: string]: { [x: string]: any; }; headers: { Authorization: any; }; }) => {
  try {

    const principalId = 'admin'

    const authorizationToken = event?.authorizationToken

    if (!authorizationToken) {
      return formatErrorJSONResponse({
        message: `no authorization header present`,
        event,
      })
    }

    const encodedCreds = authorizationToken.split(' ')[1]
    const verifyToken = (Buffer.from(encodedCreds, 'base64')).toString().split(':')[1]

    if (verifyToken !== apiToken) {
      return formatErrorJSONResponse({
        message: `wrong auth token`,
        event,
      })
    }

    const authResponse = buildAllowAllPolicy(event, principalId)

    return authResponse
  } catch (e) {


    return formatErrorJSONResponse({
      message: `error processing authorizer: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    })
  }
}

export const main = authorizer;
