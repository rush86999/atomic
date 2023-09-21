import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'
import { extendTheme, type ThemeConfig } from "@chakra-ui/react"


// 

const config: ThemeConfig = {
  useSystemColorMode: true,
  initialColorMode: 'dark',
}

const theme = extendTheme({ 
  config, 
  colors: {
    zoom: "#0E72ED"
  }, 
})

// #0E72ED
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <div className="h-screen w-full">
        <Component {...pageProps} />
      </div>
    </ChakraProvider>
  )
}

export default MyApp
