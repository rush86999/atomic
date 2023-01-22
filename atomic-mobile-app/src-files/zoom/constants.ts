
export const zoomApiUrl = 'https://api.zoom.us/v2'
export const zoomCreateMeetingUrl = 'YOUR-BACKEND/prod/create-zoom-meet-auth'
export const zoomUpdateMeetingUrl = 'YOUR-BACKEND/prod/update-zoom-meet-auth'
export const zoomDeleteMeetingUrl = 'YOUR-BACKEND/prod/delete-zoom-meet-auth'
export const zoomName = 'Zoom Meeting'
export const zoomResourceName = 'zoom'
export const zoomAdminName = 'zoomMeeting'
export const zoomOAuthStartUrl = 'YOUR-AUTH-LANDINGPAGE/zoom/mobile-start'
export const meetingType = {
  instant: 1,
  scheduled: 2,
  recurring_no_fixed: 3,
  recurring_fixed: 8

}

export const urlScheme = 'atomiclife'

export const getDeepLink = (path = '') => {
  const scheme = urlScheme
  const prefix = `${scheme}://`
  return prefix + path
}

