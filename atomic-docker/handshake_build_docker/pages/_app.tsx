import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import theme from '../lib/theme'
import "react-datepicker/dist/react-datepicker.css";
import '../styles/time-preferences.scss'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }: AppProps) {
  return (
      <ChakraProvider theme={theme}>
        <div className="h-full w-full">
          <Component {...pageProps} />
          <Analytics />
        </div>
      </ChakraProvider>
    )
}

export default MyApp
