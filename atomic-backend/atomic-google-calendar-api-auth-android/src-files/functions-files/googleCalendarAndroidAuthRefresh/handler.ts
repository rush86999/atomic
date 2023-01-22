import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse, formatErrorJSONResponse } from '@libs/api-gateway';
import { googleCalendarWebRefreshToken } from '@libs/api-helper';
import { middyfy } from '@libs/lambda';

import schema from './schema';

const googleCalendarAndroidAuth: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {

    const refreshToken = event.body.refreshToken

    if (!refreshToken) {
      return formatErrorJSONResponse({
        message: 'missing refreshToken',
        event,
      })
    }

    const tokens = await googleCalendarWebRefreshToken(refreshToken)

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
