import { Platform } from 'react-native'
import axios from 'axios'
import { Auth } from 'aws-amplify'
import { refresh } from 'react-native-app-auth'
import { dayjs } from '@app/date-utils'

import { googleConfig } from '@app/dataTypes/configs'
import {
  googlePeopleName,
  googlePeopleResource,
} from '@app/contacts/constants'

import {
  updateCalendarIntegration,
} from '@app/lib/apiHelper'
import {
  googleCalendarAndroidAuthRefreshUrl,
} from '@app/lib/constants'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getCalendarIntegrationByResource from '@app/apollo/gql/getCalendarIntegrationByResourceAndName';
import { CalendarIntegrationType } from '@dataTypes/calendar_integrationType'
import { RefreshTokenResponseBodyType } from '@app/calendar/types'



export const getGooglePeopleToken = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const googleInteg = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
      query: getCalendarIntegrationByResource,
      variables: {
        userId,
        name: googlePeopleName,
        resource: googlePeopleResource,
      }
    }))?.data?.Calendar_Integration?.[0]

    const token = googleInteg?.token
    const expiresAt = googleInteg?.expiresAt
    const oldRefreshToken = googleInteg?.refreshToken

    if (dayjs().isAfter(dayjs(expiresAt))) {

      let newAccessToken = ''
      let newRefreshToken = ''
      let newExpiresAt = ''

      if (Platform.OS === 'ios') {
        const refreshedState = await refresh(googleConfig, {
          refreshToken: oldRefreshToken,
        })

        const {
          accessToken,
          refreshToken,
          accessTokenExpirationDate: expiresAt,
        } = refreshedState

        newAccessToken = accessToken
        newRefreshToken = refreshToken
        newExpiresAt = expiresAt
      } else if (Platform.OS === 'android') {

        const url = googleCalendarAndroidAuthRefreshUrl
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }

        const data = {
          refreshToken: oldRefreshToken,
        }

        const results: {
          data: {
            message: string,
            event: RefreshTokenResponseBodyType
          },
        } = await axios.post(url, data, config)


        newAccessToken = results?.data?.event?.access_token
        newRefreshToken = oldRefreshToken
        newExpiresAt = dayjs().add(results?.data?.event?.expires_in, 'seconds').toISOString()
      }

      await updateCalendarIntegration(
        client,
        googleInteg?.id,
        undefined,
        newAccessToken,
        newRefreshToken,
        newExpiresAt,
        Platform.OS === 'android' ? 'web' : Platform.OS,
      )

      return newAccessToken
    }

    return token
  } catch (e) {

  }
}


