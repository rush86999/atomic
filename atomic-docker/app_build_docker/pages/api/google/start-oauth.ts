import type { NextApiRequest, NextApiResponse } from 'next'
import qs from 'qs'
import Cors from 'cors'
import { generateGoogleAuthUrl } from '@lib/api-backend-helper'

import { superTokensNextWrapper } from 'supertokens-node/nextjs'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import supertokens from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'

supertokens.init(backendConfig())

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
    origin: ["https://atomiclife.app", /\.atomiclife\.app$/],
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    fn: Function
) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result)
            }

            return resolve(result)
        })
    })
}


export default async function handler(req: any, res: any) {
    try {
        // Run the middleware
        await runMiddleware(req, res, cors)

        await superTokensNextWrapper(
            async (next) => {
              return await verifySession()(req  as any, res as any, next)
            },
            req,
            res
        )

        if (!req.session.getUserId()) {
            return res.redirect('/User/Login/UserLogin')
        }
        
        const sub = req.session.getUserId()

        // attendeeId, meetingId
        // const attendeeId = req?.query?.attendeeId
        // const meetingId = req?.query?.meetingId
        // console.log(attendeeId, ' ateendeeId')
        // console.log(meetingId, ' meetingId')
        
        // const state = `${meetingId}#${attendeeId}`

        const authorizationUrl = generateGoogleAuthUrl(sub)

        // return res.writeHead(301, { "Location": authorizationUrl });
        return res.redirect(authorizationUrl)
     
    } catch (e) {
        console.log(e, ' unable to auth')
        const errorMessage = e instanceof Error ? e.message : 'Internal server error'
        return res.status(500).json({ statusCode: 500, message: errorMessage })
    }
}



