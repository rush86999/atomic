import type { NextApiRequest, NextApiResponse } from 'next'
import qs from 'qs'
import Cors from 'cors'
import { handshakeUrl } from '@lib/constants'
import { exchangeCodeForTokens } from '@lib/api-helper'

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
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



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Run the middleware
        await runMiddleware(req, res, cors)

        const thisUrl = new URL(req.url as string, `https://${req.headers.host}`)

        if (thisUrl.searchParams.get('error')) {
            const error = thisUrl.searchParams.get('error') as string
        
            // pass the error to handshakUrl
            if (error === 'access_denied') {
                return res.redirect(`${handshakeUrl}?${qs.stringify({ error })}`)
            }
        }
        

        // example: https://oauth2.example.com/auth?code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7

        const code = thisUrl.searchParams.get('code') as string
        // console.log(code, ' code')

        
        const stateString = thisUrl.searchParams.get('state') as string

        const meetingId = stateString?.split('#')?.[0]

        console.log(meetingId, ' meetingId')

        const attendeeId = stateString?.split('#')?.[1]

        console.log(attendeeId, ' attendeeId')

        const tokens = await exchangeCodeForTokens(code as string)

        // console.log(tokens, ' tokens')

        return res.redirect(`${handshakeUrl}/meeting/callback-calendar-sync?${qs.stringify({ ...tokens, meetingId, attendeeId })}`)

    } catch (e) {
        console.log(e, ' unable to auth')
    }
}