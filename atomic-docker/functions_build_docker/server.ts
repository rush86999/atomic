import path from 'path'
import express, { Request } from 'express'
import morgan from 'morgan'
import glob from 'glob'
// import * as jwt from 'jsonwebtoken'
// import qs from 'qs'
import { WebSocketServer }  from 'ws'
// import JsonWebToken, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken'
// import jwksClient from 'jwks-rsa'
import qs from 'qs'
import * as jose from 'jose'
import http from 'http'

const PORT = 3000

const PORT2 = 3030

function onSocketError(err) {
  console.error(err);
}

// var client = jwksClient({
//   jwksUri: `${process.env.APP_CLIENT_URL}/api/auth/jwt/jwks.json`
// });

const JWKS = jose.createRemoteJWKSet(new URL(`${process.env.APP_CLIENT_URL}/api/auth/jwt/jwks.json`))

// function getKey(header: JwtHeader, callback: SigningKeyCallback) {
//   client.getSigningKey(header.kid, function (err, key) {
//     var signingKey = key!.getPublicKey();
//     callback(err, signingKey);
//   });
// }

const main = async () => {
  const app = express()
  const app2 = express()

  // log middleware
  // skipping /healthz because docker health checks it every second or so
  app.use(
    morgan('tiny', {
      skip: (req) => req.url === '/healthz'
    })
  )

  app2.use(
    morgan('tiny', {
      skip: (req) => req.url === '/healthz'
    })
  )

  // * Same settings as in Watchtower
  app.use(
    express.json({
      limit: '6MB',
      verify: (req, _res, buf) => {
        // adding the raw body to the reqest object so it can be used for
        // signature verification(e.g.Stripe Webhooks)
        (req as any).rawBody = buf.toString()
      }
    })
  )

  app2.use(
    express.json({
      limit: '6MB',
      verify: (req, _res, buf) => {
        // adding the raw body to the reqest object so it can be used for
        // signature verification(e.g.Stripe Webhooks)
        (req as any).rawBody = buf.toString()
      }
    })
  )

  app.use(express.urlencoded({ extended: true }))

  app2.use(express.urlencoded({ extended: true }))

  app.use(async (req, res, next) => {

    // paths with /public/ are skipped
    if (req.path.match(/\/public/)) {
      return next();
    }

    // paths ending with -public are skipped
    if (req.path.match(/\-public$/)) {
      return next();
    }

    // paths ending with in -admin are skipped
    if (req.path.match(/\-admin$/)) {
      // verify basic auth header: `Basic username:password` 
      const authorizationToken = req.headers.authorization

      const encodedCreds = authorizationToken.split(' ')[1]
      const verifyToken = (Buffer.from(encodedCreds, 'base64')).toString().split(':')[1]

      if (
          verifyToken !== process.env.BASIC_AUTH
      ) {
          return res.status(401).send("Unauthorized");
      }
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      try {
        const result = await jose.jwtVerify(token, JWKS)
        console.log(result, ' success jwtVerfiy')
        next()
      } catch (e) {
        console.log(e, ' e')
        return res.sendStatus(403)
      }
    } else {
      res.sendStatus(401);
    }
  });

  app2.use(async (req, res, next) => {

    // paths with /public/ are skipped
    if (req.path.match(/\/public/)) {
      return next();
    }

    // paths ending with -public are skipped
    if (req.path.match(/\-public$/)) {
      return next();
    }

    // paths ending with in -admin are skipped
    if (req.path.match(/\-admin$/)) {
      // verify basic auth header: `Basic username:password` 
      const authorizationToken = req.headers.authorization

      const encodedCreds = authorizationToken.split(' ')[1]
      const verifyToken = (Buffer.from(encodedCreds, 'base64')).toString().split(':')[1]

      if (
          verifyToken !== process.env.BASIC_AUTH
      ) {
          return res.status(401).send("Unauthorized");
      }
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      try {
        const result = await jose.jwtVerify(token, JWKS)
        console.log(result, ' success jwtVerfiy')
        next()
      } catch (e) {
        console.log(e, ' e')
        return res.sendStatus(403)
      }
    } else {
      res.sendStatus(401);
    }
  });


  app.disable('x-powered-by')

  app2.disable('x-powered-by')

  app.get('/healthz', (_req, res) => {
    res.status(200).send('ok')
  })

  app2.get('/healthz', (_req, res) => {
    res.status(200).send('ok')
  })

  const functionsPath = path.join(process.cwd(), process.env.FUNCTIONS_RELATIVE_PATH)
  const files = glob.sync('**/*.@(js|ts)', {
    cwd: functionsPath,
    ignore: [
      '**/node_modules/**', // ignore node_modules directories
      '**/_*/**', // ignore files inside directories that start with _
      '**/_*' // ignore files that start with _
    ]
  })

  for (const file of files) {
    const { default: handler } = await import(path.join(functionsPath, file))

    // File path relative to the project root directory. Used for logging.
    const relativePath = path.relative(process.env.NHOST_PROJECT_PATH, file)

    if (handler) {
      const route = `/${file}`.replace(/(\.ts|\.js)$/, '').replace(/\/index$/, '/')

      try {
        app.all(route, handler)
        app2.all(route, handler)
      } catch (error) {
        console.warn(`Unable to load file ${relativePath} as a Serverless Function`)
        continue
      }

      console.log(`Loaded route ${route} from ${relativePath}`)
    } else {
      console.warn(`No default export at ${relativePath}`)
    }
  }

  const httpServer = http.createServer(app)

  const httpServer2 = http.createServer(app2)

  //
  // Create a WebSocket server completely detached from the HTTP server.
  //
  const wss = new WebSocketServer({ clientTracking: false, noServer: true });

  const wss2 = new WebSocketServer({ clientTracking: false, noServer: true });
  // process message
  const wsFiles = glob.sync('**/_chat/chat_brain/handler.ts', {
    cwd: functionsPath,
    ignore: [
      '**/node_modules/**', // ignore node_modules directories
     
    ]
  })

  httpServer.on('upgrade', async function (request: Request, socket, head) {
    socket.on('error', onSocketError);
    

    console.log('Parsing session from request... httpServer');
    console.log(request.url, ' request.url')

    console.log(request.query, ' request.query')
    // weird query and url value = '/?Auth=adfd...'

    const string2Parse = request.url?.slice(2)

    const queryParams = qs.parse(string2Parse)
    const authHeader = queryParams.Auth as string

    console.log(authHeader, ' authHeader')

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      try {
        console.log(authHeader, ' authHeader')
        console.log(JWKS, ' JWKS')
        const result = await jose.jwtVerify(token, JWKS)
        console.log(result, ' success jwtVerfy')

      } catch (e) {
        console.log(e, ' error jwtVerfy')
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    } else {
      console.log('HTTP/1.1 401 Unauthorized inside httpServer')
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    socket.removeListener('error', onSocketError);

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  });

  httpServer2.on('upgrade', async function (request: Request, socket, head) {
    socket.on('error', onSocketError);
    

    console.log('Parsing session from request... httpServer2');
    console.log(request.url, ' request.url')


    console.log(request.query, ' request.query')

    // weird query value = '/?Auth=adfd...'

    const string2Parse = request.url?.slice(2)

    const queryParams = qs.parse(string2Parse)
    
    const authHeader = queryParams.Auth as string

    console.log(authHeader, ' authHeader')

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      try {
        console.log(authHeader, ' authHeader')
        console.log(JWKS, ' JWKS')
        const result = await jose.jwtVerify(token, JWKS)
        console.log(result, ' success2 jwtVerify2')

      } catch (e) {
        console.log(e, ' error2 jwtVerify2')
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    socket.removeListener('error', onSocketError);

    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit('connection', ws, request);
    });
  });

  const keepAlivePeriod = 50000
  wss.on('connection', async function connection(ws) {
    console.log('connection called')

    ws.on('error', console.error);

    // Send a 'ping' message to the client at regular intervals
    const keepAliveId = setInterval(() => {
      ws.send(JSON.stringify('ping'));
    }, keepAlivePeriod || 5000);

    ws.on('message', async function incoming(message) {
      console.log('received: %s', message);
      try {
        const { default: handler } = await import(path.join(functionsPath, wsFiles?.[0]))
        const replyMessage = await handler(message)
        // reply back
        ws.send(replyMessage);
      } catch (e) {
        console.log(e, ' unable to process sockets')
      }
      
    });

    ws.on('close', function () {
      console.log('closed')
      clearInterval(keepAliveId);
    });
  });

  wss2.on('connection', async function connection(ws) {
    console.log('connection called')

    ws.on('error', console.error);

    // Send a 'ping' message to the client at regular intervals
    const keepAliveId = setInterval(() => {
      ws.send(JSON.stringify('ping'));
    }, keepAlivePeriod || 5000);

    ws.on('message', async function incoming(message) {
      console.log('received: %s', message);
      try {
        const { default: handler } = await import(path.join(functionsPath, wsFiles?.[0]))
        const replyMessage = await handler(message)
        // reply back
        ws.send(replyMessage);
      } catch (e) {
        console.log(e, ' unable to process sockets')
      }
      
    });

    ws.on('close', function () {
      console.log('closed')
      clearInterval(keepAliveId);
    });
  });
  
  // get all worker files 
  const workerFiles = glob.sync('**/*_/*.@(js|ts)', {
    cwd: functionsPath,
    ignore: [
      '**/node_modules/**', // ignore node_modules directories
    ]
  })

  // activate kafka consumers
  const workerHandlers = []
  
  for (const workerFile of workerFiles) {
    const { default: handler } = await import(path.join(functionsPath, workerFile))

    workerHandlers.push(handler)
  }

  await Promise.all(workerHandlers?.map(handler => handler()))

  httpServer.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
  })

  httpServer2.listen(PORT2, () => {
    console.log(`Listening on port ${PORT2}`)
  })

}

main()
