/**
 * @format
 */
if (typeof Buffer === 'undefined') {
  global.Buffer = require('@craftzdog/react-native-buffer').Buffer;
}
import '@formatjs/intl-getcanonicallocales/polyfill';

import '@formatjs/intl-locale/polyfill';

import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';

import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-numberformat/locale-data/en';

import '@formatjs/intl-datetimeformat/polyfill'
import '@formatjs/intl-datetimeformat/locale-data/en'
import '@formatjs/intl-datetimeformat/add-all-tz'

import 'react-native-reanimated';
import 'react-native-gesture-handler';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@azure/core-asynciterator-polyfill';
import {AppRegistry} from 'react-native';
import {shim as shimBase64} from 'react-native-quick-base64';

PushNotification.configure({
  onRegister: function (token) {
  },

  onNotification: function (notification) {


    notification.finish(PushNotificationIOS.FetchResult.NoData);
  },

  onAction: function (notification) {

  },

  onRegistrationError: function (err) {
    console.error(err.message, err);
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,

  /**
   * (optional) default: true
   * - Specified if permissions (ios) and token (android and ios) will requested or not,
   * - if not, you must call PushNotificationsHandler.requestPermissions() later
   * - if you are not using remote notification or do not have Firebase installed, use this:
   *     requestPermissions: Platform.OS === 'ios'
   */
  requestPermissions: true,
});


import App from './App';
import {name as appName} from './app.json';

if (!__DEV__) {
  
}

const isHermes = () => !!global.HermesInternal;


if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');
  for (var p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

shimBase64();
process.browser = true;

AppRegistry.registerComponent(appName, () => App);
