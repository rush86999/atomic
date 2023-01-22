import PushNotification, { Importance, PushNotificationDeliveredObject, PushNotificationPermissions, PushNotificationScheduledLocalObject, ReceivedNotification } from 'react-native-push-notification'
import NotificationHandler from '@screens/Notification/NotificationHandler'

import { palette } from '@theme/theme'

type emitNotification = Omit<ReceivedNotification, "userInfo">

type tokenObject = { os: string, token: string }

type onRegister = (tokenObject: tokenObject) => void

type onNotification = (notification: emitNotification) => void

type permissionCallback = (permissions: PushNotificationPermissions) => void

type getScheduledLocalNotifications = (notifications: PushNotificationScheduledLocalObject[]) => void

type getDeliveredNotifications = (notifications: PushNotificationDeliveredObject[]) => void

type userInfo = {
  screen: string,
}

export default class NotifService {

  lastId: number
  lastChannelCounter: number

  constructor(onRegister: onRegister, onNotification: onNotification) {
    this.lastId = 0
    this.lastChannelCounter = 0

    this.createDefaultChannels()

    NotificationHandler.attachRegister(onRegister);
    NotificationHandler.attachNotification(onNotification);

    // Clear badge number at start
    PushNotification.getApplicationIconBadgeNumber(function (number) {
      if (number > 0) {
        PushNotification.setApplicationIconBadgeNumber(0);
      }
    })

    PushNotification.getChannels(function (channels) {
      // 
    })
  }

  createDefaultChannels() {
    PushNotification.createChannel(
      {
        channelId: "atomic-life", // (required)
        channelName: `Default channel`, // (required)
        channelDescription: "A default channel", // (optional) default: undefined.
        soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
        importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created) => 
    )
    PushNotification.createChannel(
      {
        channelId: "sound-channel-id", // (required)
        channelName: `Sound channel`, // (required)
        channelDescription: "A sound channel", // (optional) default: undefined.
        soundName: "sample.mp3", // (optional) See `soundName` parameter of `localNotification` function
        importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created) => 
    );
  }

  createOrUpdateChannel() {
    this.lastChannelCounter++;
    PushNotification.createChannel(
      {
        channelId: "custom-channel-id", // (required)
        channelName: `Atomic Life: ${this.lastChannelCounter}`, // (required)
        channelDescription: `A custom channel to categorise your custom notifications. Updated at: ${Date.now()}`, // (optional) default: undefined.
        soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
        importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created) => 
    );
  }

  popInitialNotification() {
    PushNotification.popInitialNotification((notification) => 
  }

  localNotif(
    message: string,
    text1?: string,
    text2?: string,
    // subtitle?: string,
    when?: number, // milliseconds
    title?: string,
    userInfo?: userInfo,
  ) {
    this.lastId++;
    PushNotification.localNotification({
      /* Android Only Properties */
      channelId: 'atomic-life',
      ticker: 'Atomic Life', // (optional)
      autoCancel: true, // (optional) default: true
      largeIcon: 'ic_launcher', // (optional) default: "ic_launcher"
      smallIcon: 'ic_notification', // (optional) default: "ic_notification" with fallback for "ic_launcher"
      bigText: text1, // (optional) default: "message" prop
      subText: text2, // (optional) default: none
      color: palette.purplePrimary, // (optional) default: system default
      vibrate: true, // (optional) default: true
      vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
      // tag: 'some_tag', // (optional) add tag to message
      // group: 'group', // (optional) add group to message
      // groupSummary: false, // (optional) set this notification to be the group summary for a group of notifications, default: false
      ongoing: true, // (optional) set whether this is an "ongoing" notification
      // actions: ['Yes', 'No'], // (Android only) See the doc for notification actions to know more
      invokeApp: true, // (optional) This enable click on actions to bring back the application to foreground or stay in background, default: true

      when, // (optionnal) Add a timestamp pertaining to the notification (usually the time the event occurred). For apps targeting Build.VERSION_CODES.N and above, this time is not shown anymore by default and must be opted into by using `showWhen`, default: null.
      usesChronometer: true, // (optional) Show the `when` field as a stopwatch. Instead of presenting `when` as a timestamp, the notification will show an automatically updating display of the minutes and seconds since when. Useful when showing an elapsed time (like an ongoing phone call), default: false.
      timeoutAfter: null, // (optional) Specifies a duration in milliseconds after which this notification should be canceled, if it is not already canceled, default: null

      /* iOS only properties */
      // category: '', // (optional) default: empty string
      // subtitle, // (optional) smaller title below notification title

      /* iOS and Android properties */
      id: this.lastId, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
      title, // (optional)
      message, // (required)
      userInfo: userInfo ?? { screen: 'home' }, // (optional) default: {} (using null throws a JSON value '<null>' error)
      // playSound: !!soundName, // (optional) default: true
      // soundName: soundName ? soundName : 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
      // number: 10, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
    });
  }

  scheduleNotif(
    date: Date,
    message: string,
    text1?: string,
    text2?: string,
    ongoing?: boolean,
    when?: number,
    title?: string,
    userInfo?: userInfo,
  ) {
    this.lastId++
    PushNotification.localNotificationSchedule({
      date, // in 30 secs

      /* Android Only Properties */
      channelId: 'atomic-life',
      ticker: 'Atomic Life', // (optional)
      autoCancel: true, // (optional) default: true
      largeIcon: 'ic_launcher', // (optional) default: "ic_launcher"
      smallIcon: 'ic_notification', // (optional) default: "ic_notification" with fallback for "ic_launcher"
      bigText: text1, // (optional) default: "message" prop
      subText: text2, // (optional) default: none
      color: palette.purplePrimary, // (optional) default: system default
      vibrate: true, // (optional) default: true
      vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
      // tag: 'some_tag', // (optional) add tag to message
      // group: 'group', // (optional) add group to message
      // groupSummary: false, // (optional) set this notification to be the group summary for a group of notifications, default: false
      ongoing, // (optional) set whether this is an "ongoing" notification
      // actions: ['Yes', 'No'], // (Android only) See the doc for notification actions to know more
      // invokeApp: false, // (optional) This enable click on actions to bring back the application to foreground or stay in background, default: true

      when, // (optionnal) Add a timestamp pertaining to the notification (usually the time the event occurred). For apps targeting Build.VERSION_CODES.N and above, this time is not shown anymore by default and must be opted into by using `showWhen`, default: null.
      usesChronometer: true, // (optional) Show the `when` field as a stopwatch. Instead of presenting `when` as a timestamp, the notification will show an automatically updating display of the minutes and seconds since when. Useful when showing an elapsed time (like an ongoing phone call), default: false.
      timeoutAfter: null, // (optional) Specifies a duration in milliseconds after which this notification should be canceled, if it is not already canceled, default: null

      /* iOS only properties */
      category: '', // (optional) default: empty string
      /* iOS and Android properties */
      // id: this.lastId, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
      title, // (optional)
      message, // (required)
      userInfo: userInfo ?? { sceen: "home" }, // (optional) default: {} (using null throws a JSON value '<null>' error)
      // playSound: !!soundName, // (optional) default: true
      // soundName: soundName ? soundName : 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
      // number: 10, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
    });
  }

  checkPermission(cbk: permissionCallback) {
    return PushNotification.checkPermissions(cbk)
  }

  requestPermissions() {
    return PushNotification.requestPermissions()
  }

  cancelNotif() {
    PushNotification.cancelLocalNotifications({ id: '' + this.lastId })
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  abandonPermissions() {
    PushNotification.abandonPermissions();
  }

  getScheduledLocalNotifications(callback: getScheduledLocalNotifications) {
    PushNotification.getScheduledLocalNotifications(callback)
  }

  getDeliveredNotifications(callback: getDeliveredNotifications) {
    PushNotification.getDeliveredNotifications(callback);
  }
}
