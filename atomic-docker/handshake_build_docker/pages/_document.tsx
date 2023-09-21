// pages/_document.js

import { ColorModeScript } from '@chakra-ui/react'
import { Html, Head, Main, NextScript } from 'next/document'
import theme from '../lib/theme'
export default function Document() {
    return (
      <Html lang='en' data-theme="dark">
        <Head>
          <link
            href="https://fonts.googleapis.com/css?family=Heebo:300,400,500,700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body className="h-full">
          
          <Main />
          <NextScript />
        </body>
      </Html>
    )
}