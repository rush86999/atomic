import { Platform } from 'react-native'

export const googleConfig = Platform.OS === 'android'
  ? {
    issuer: 'https://accounts.google.com',
    clientId: 'YOUR-ANDROID-CLIENTID.apps.googleusercontent.com',
    redirectUrl: 'com.googleusercontent.apps.YOUR-ANDROID:/oauth2redirect',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/contacts.readonly'
    ]
  } : {
    issuer: 'https://accounts.google.com',
    clientId: 'YOUR-IOS-CLIENTID.apps.googleusercontent.com',
    redirectUrl: 'com.googleusercontent.apps.YOUR-IOS:/oauth2redirect/google',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/contacts.readonly'
    ]
  }


