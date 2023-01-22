import PushNotification, { ReceivedNotification } from 'react-native-push-notification'

type notification = {
  foreground: boolean,
  userInteraction: boolean,
  message: string,
  data: object,
  action?: string,
}

type emitNotification = Omit<ReceivedNotification, "userInfo">

type error = {
  message: string,
}

type onRegister = (tokenObject: tokenObject) => void

type onNotification = (notification: emitNotification) => void

type tokenObject = { os: string, token: string }

class NotificationHandler {

  _onNotification: (notification: emitNotification) => void
  _onRegister: (tokenObject: tokenObject) => void

  onNotification(notification: emitNotification) {

    this._onNotification(notification)
  }

  onRegister(tokenObject: tokenObject) {
    this._onRegister(tokenObject)
  }

  onAction(notification: emitNotification) {

    if (notification?.action === 'Yes') {
      PushNotification.invokeApp(notification as notification);
    }
  }

  onRegistrationError(err: error) {
  }

  attachRegister(handler: onRegister) {
    this._onRegister = handler
  }

  attachNotification(handler: onNotification) {
    this._onNotification = handler
  }
}

const handler = new NotificationHandler();

PushNotification.configure({
  onRegister: handler.onRegister.bind(handler),

  onNotification: handler.onNotification.bind(handler),

  onAction: handler.onAction.bind(handler),

  onRegistrationError: handler.onRegistrationError.bind(handler),

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,

  requestPermissions: true,
})

export default handler
