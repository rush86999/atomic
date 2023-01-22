import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse, formatErrorJSONResponse } from '@libs/api-gateway';
import { getGoogleTokenAndRefreshToken } from '@libs/api-helper';
import { middyfy } from '@libs/lambda';

import schema from './schema';

const googleCalendarAndroidAuth: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {

    const code = event.body.code

    if (!code) {
      return formatErrorJSONResponse({
        message: 'missing code',
        event,
      })
    }

    const tokens = await getGoogleTokenAndRefreshToken(code)

    return formatJSONResponse({
      message: 'retrieved token successfully',
      event: tokens,
    })
  } catch (e) {

    return formatErrorJSONResponse({
      message: 'something went wrong with getting token',
      event: e,
    })
  }
};

export const main = middyfy(googleCalendarAndroidAuth);
