// pages/_document.js


import Document, { Html, Head, Main, NextScript,  DocumentProps,
  DocumentContext, } from 'next/document'
import { ColorModeScript } from '@chakra-ui/react'

import { AppType } from 'next/app'

import createEmotionServer from '@emotion/server/create-instance';
import theme from '@lib/mui/theme';
import createEmotionCache from '@lib/mui/createEmotionCache'
import { MyAppProps } from './_app';



interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: JSX.Element[];
}

export default function MyDocument(props: MyDocumentProps) {
  const { emotionStyleTags } = props;

  
    return (
      <Html lang='en'>
        <Head>
           <meta name="theme-color" content={theme.palette.primary.main} />
          <link rel="shortcut icon" href="/favicon.ico" />
          <meta name="emotion-insertion-point" content="" />
          {emotionStyleTags}
          <link
            href="https://fonts.googleapis.com/css?family=Heebo:300,400,500,700&display=swap"
            rel="stylesheet"
          />
          <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css"></link>
          
          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.1.1/css/all.css" />

          <style type="text/css">
            {`
              @font-face {
                font-family: 'MaterialIcons';
                src: url(https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2) format('woff2');
              }

              @font-face {
                font-family: 'FontAwesome';
                src: url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/webfonts/fa-solid-900.woff2) format('woff2');
              }


              @font-face {
                font-family: 'Entypo';
                src: url(https://cdnjs.cloudflare.com/ajax/libs/entypo/2.0/entypo.woff) format('woff');
              }

              @font-face {
                font-family: 'MaterialCommunityIcons';
                src: url(https://cdn.jsdelivr.net/npm/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf) format('truetype');
              }

          `}
          </style>
        </Head>
        <body>
          <ColorModeScript initialColorMode="system" />
          <Main />
          <div id="modal-root"></div>
          <NextScript />
          
        </body>
      </Html>
    )
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {

 const originalRenderPage = ctx.renderPage;

  // You can consider sharing the same Emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: React.ComponentType<React.ComponentProps<AppType> & MyAppProps>) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  // This is important. It prevents Emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};

