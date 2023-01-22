import { formatErrorJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { appleRevokeToken, deleteCognitoUser, deleteUserFromDb } from '@libs/api-helper';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import { DeleteUserAccountRequestBodyType } from './types';

const deleteUserAccountHandler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    // validate event
    const body: DeleteUserAccountRequestBodyType = event?.body as DeleteUserAccountRequestBodyType
    if (!body) {
      return formatErrorJSONResponse({
        message: 'No body found in event',
      })
    }

    const userId = body?.userId
    if (!userId) {
      return formatErrorJSONResponse({
        message: 'No userId found in body',
      })
    }

    const userName = body?.userName
    if (!userName) {
      return formatErrorJSONResponse({
        message: 'No userName found in body',
      })
    }

    const refreshToken = body?.refreshToken
    if (!refreshToken) {
      return formatErrorJSONResponse({
        message: 'No refreshToken found in body',
      })
    }
    const accessToken = body?.accessToken
    if (!accessToken) {
      return formatErrorJSONResponse({
        message: 'No accessToken found in body',
      })
    }

    // delete user from cognito
    await deleteCognitoUser(userName)
    // delete user from db
    await deleteUserFromDb(userId)

  } catch (e) {

    return formatErrorJSONResponse({
      message: 'error userDeleteAccount',
      event,
    })
  }

  try {
    // validate event
    const body: DeleteUserAccountRequestBodyType = event?.body as DeleteUserAccountRequestBodyType

    const refreshToken = body?.refreshToken

    const accessToken = body?.accessToken
    // revoke tokens from apple
    await appleRevokeToken(refreshToken, accessToken)
  } catch (e) {

  }

  return formatJSONResponse({
    message: `deleteUserAccountHandler called successfully`,
    event,
  });

};

export const main = middyfy(deleteUserAccountHandler);
