import { Linking, Platform } from 'react-native'
import axios from 'axios'
import { refresh } from 'react-native-app-auth'
import qs from 'qs'
import Toast from 'react-native-toast-message'

import { dayjs } from '@app/date-utils'
import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import { getZoomConfig } from '@app/dataTypes/configs'
import {
  zoomName,
  zoomResourceName,
  zoomCreateMeetingUrl,
  zoomUpdateMeetingUrl,
  zoomDeleteMeetingUrl,
  zoomOAuthStartUrl,
} from '@app/zoom/constants'
import {
  CreateMeetingResponseType,
  CreateZoomMeetObjectType,
  UpdateZoomMeetObjectType,
  DeleteZoomMeetObjectType,
} from '@app/zoom/types'
import {
  updateCalendarIntegration,
} from '@app/lib/apiHelper'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getCalendarIntegrationByResource from '@app/apollo/gql/getCalendarIntegrationByResourceAndName'
import { CalendarIntegrationType } from '@app/dataTypes/Calendar_IntegrationType';
import { Auth } from '@aws-amplify/auth';
import { palette } from '@theme/theme'


export const closeZoomOAuthLink = async () => {
  try {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.close()
    }
  } catch (e) {

  }
}
export const openZoomOAuthLink = async (
  userId: string,
  path: string,
) => {
  try {
    const url = `${zoomOAuthStartUrl}?${qs.stringify({ userId, path, })}`

    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(url, {
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: palette.pinkPrimary,
        preferredControlTintColor: palette.white,
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        ephemeralWebSession: false,
        showTitle: true,
        toolbarColor: palette.pinkPrimary,
        secondaryToolbarColor: palette.purplePrimary,
        navigationBarColor: palette.purplePrimary,
        navigationBarDividerColor: palette.white,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        forceCloseOnRedirection: false,
        animations: {
          startEnter: 'slide_in_right',
          startExit: 'slide_out_left',
          endEnter: 'slide_in_left',
          endExit: 'slide_out_right'
        },
        headers: {
          'my-custom-header': 'Login to Zoom'
        }
      })
    }
    else Linking.openURL(url)
  } catch (e) {

  }
}

export const zoomAvailable = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const calIntObject = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
      query: getCalendarIntegrationByResource,
      variables: {
        userId,
        name: zoomName,
        resource: zoomResourceName,
      },
    })).data?.Calendar_Integration?.[0]
    if (calIntObject?.enabled) {
      return true
    }
    return false
  } catch (e) {

  }
}


export const createZoomMeeting = async (
  userId: string,
  startDate: string,
  timezone: string,
  agenda: string,
  duration: number,
  contactName?: string,
  contactEmail?: string,
  meetingInvitees?: string[],
  privateMeeting?: boolean,
) => {
  try {
    if (startDate) {
      throw new Error('no startDate present inside createZoomMeeting')
    }

    if (!timezone) {
      throw new Error('no timezone inside createZoomMeeting')
    }

    if (!agenda) {
      throw new Error('no agenda inside createZoomMeeting')
    }

    if (!duration) {
      throw new Error('no duration inside createZoomMeeting')
    }

    if (!userId) {
      throw new Error('no userId inside createZoomMeeting')
    }

    const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    }

    const data: CreateZoomMeetObjectType = {
      startDate,
      timezone,
      agenda,
      duration,
      userId,
      contactName,
      contactEmail,
      meetingInvitees,
      privateMeeting,
    }

    const url = zoomCreateMeetingUrl

    const results = await axios.post<CreateMeetingResponseType>(url, data, config)

    const {
      data: {
        join_url,
        id,
        start_url,
        status,
      }
    } = results

    return { id, join_url, start_url, status }

  } catch (e) {

    Toast.show({
      type: 'error',
      text1: 'Unable to create meeting',
      text2: 'We were unable to create a meeting'
    })
  }
}

export const deleteZoomMeeting = async (
  userId: string,
  meetingId: number,
  scheduleForReminder?: boolean,
  cancelMeetingReminder?: string,
) => {
  try {
    if (typeof meetingId !== 'number') {

      return
    }

    if (!userId) {
      throw new Error('no userId inside deleteZoomMeeting')
    }

    const url = zoomDeleteMeetingUrl

    const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    }

    const data: DeleteZoomMeetObjectType = {
      meetingId,
      userId,
      scheduleForReminder,
      cancelMeetingReminder,
    }

    const results = await axios.post(url, data, config)

  } catch (e) {

    Toast.show({
      type: 'error',
      text1: 'Unable to delete meeting',
      text2: 'We were unable to delete a meeting'
    })
  }
}

export const updateZoomMeeting = async (
  userId: string,
  meetingId: number,
  startDate?: string,
  timezone?: string,
  agenda?: string,
  duration?: number,
  contactName?: string,
  contactEmail?: string,
  meetingInvitees?: string[],
  privateMeeting?: boolean,
) => {
  try {

    if (!userId) {
      throw new Error('no userId inside updateZoomMeeting')
    }

    if (typeof meetingId !== 'number') {
      throw new Error('id was not properly parsed to int  inside updateZoomMeeting')
    }

    const url = zoomUpdateMeetingUrl

    const data: UpdateZoomMeetObjectType = {
      userId,
      meetingId,
      startDate,
      timezone,
      agenda,
      duration,
      contactName,
      contactEmail,
      meetingInvitees,
      privateMeeting,
    }

    const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    }

    const results = await axios.post<CreateMeetingResponseType>(url, data, config)

    const {
      data: {
        join_url,
        id,
        start_url,
        status,
      }
    } = results

    return { id, join_url, start_url, status }

  } catch (e) {

    Toast.show({
      type: 'error',
      text1: 'Unable to update meeting',
      text2: 'We were unable to update a meeting'
    })
  }
}

