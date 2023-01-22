
import React from 'react'
import {
  useColorScheme,
  LogBox,
} from 'react-native'
import {ThemeProvider} from '@shopify/restyle'

import Toast, { BaseToast } from 'react-native-toast-message'
import { Provider as PaperProvider } from 'react-native-paper'
import {
  TourGuideProvider,
} from 'rn-tourguide'
import codePush from 'react-native-code-push'
import * as Sentry from "@sentry/react-native"
import {
  theme,
  darkTheme,
  paperTheme,
  darkPaperTheme,
} from '@theme/theme'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import UserNavigation from '@screens/Navigation/UserNavigation'
import { Tooltip } from './SAMPLE-ToolTipComponent'
import SafeAreaBox from '@components/SafeAreaBox'
import '@theme/FoundationConfig'
import '@theme/ComponentsConfig'
import { release, dist } from "./app.json"
const toastConfig = {
  toast_timer: (props: any) => (
    <BaseToast
      {...props}
    />
  )
}

Sentry.init({
  dsn: "YOUR-SENTRY-DSN",
  tracesSampleRate: 1.0,
  release,
  dist,
})

LogBox.ignoreAllLogs()

const App = () => {
  const darkMode = useColorScheme() === 'dark'

  return (
            <ThemeProvider theme={darkMode ? darkTheme : theme}>
                <SafeAreaProvider>
                  <SafeAreaBox flex={1} backgroundColor="mainBackground">
                  <PaperProvider theme={darkMode ? darkPaperTheme : paperTheme}>
                    <TourGuideProvider
                      {...{
                        borderRadius: 16,
                        tooltipComponent: Tooltip,
                      }}
                      >
                      <UserNavigation />
                    </TourGuideProvider>
                    </PaperProvider>
                  <Toast config={toastConfig} ref={(ref) => Toast.setRef(ref)} />
                </SafeAreaBox>
              </SafeAreaProvider>
            </ThemeProvider>
  )
}


const codePushOptions = {
  checkFrequency: __DEV__ ? codePush.CheckFrequency.MANUAL : codePush.CheckFrequency.ON_APP_RESUME,
}

export default codePush(codePushOptions)(Sentry.wrap(App))
