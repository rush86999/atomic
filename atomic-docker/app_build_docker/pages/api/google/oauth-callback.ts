import type { NextApiRequest, NextApiResponse } from 'next'
import qs from 'qs'
import Cors from 'cors'
import { exchangeCodeForTokens, getAllCalendarIntegrationsByResource, getGoogleColors, triggerGooglePeopleSync, updateGoogleIntegration } from '@lib/api-backend-helper'
import { googleClientTypeForMainWebApp, googleCalendarName, googleResourceName } from '../../../lib/calendarLib/constants';
import { colorType } from '@lib/dataTypes/Calendar_IntegrationType'
import { dayjs } from '@lib/date-utils'

import { superTokensNextWrapper } from 'supertokens-node/nextjs'
import { verifySession } from 'supertokens-node/recipe/session/framework/express'
import supertokens from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'

const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
})

supertokens.init(backendConfig())

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

        await superTokensNextWrapper(
            async (next) => {
              return await verifySession()(req  as any, res as any, next)
            },
            req,
            res
          )

        const thisUrl = new URL(req.url as string, `https://${req.headers.host}`)

        if (thisUrl.searchParams.get('error')) {
            const error = thisUrl.searchParams.get('error') as string

            // pass the error to handshakUrl
            if (error === 'access_denied') {
                return res.redirect(`/Auth/callback-google-oauth?${qs.stringify({ error })}`)
            }
        }


        // example: https://oauth2.example.com/auth?code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7

        const code = thisUrl.searchParams.get('code') as string
        // console.log(code, ' code')


        const sub = thisUrl.searchParams.get('state') as string

        // const meetingId = stateString?.split('#')?.[0]

        // console.log(meetingId, ' meetingId')

        // const attendeeId = stateString?.split('#')?.[1]

        // console.log(attendeeId, ' attendeeId')

        const tokens = await exchangeCodeForTokens(code as string)

        console.log(tokens, ' tokens')

        const calIntegrations = await getAllCalendarIntegrationsByResource(sub, googleResourceName)

        // get google colors
        const colors = await getGoogleColors(tokens.access_token)

        const modifiedColors = []

        const calendarColor = colors?.calendar
        const eventColor = colors?.event

        for (const property in calendarColor) {
            const color: colorType = {
                id: property,
                itemType: 'calendar',
                background: calendarColor[property]?.background,
                foreground: calendarColor[property]?.foreground,
            }
            modifiedColors.push(color)
        }

        for (const property in eventColor) {
            const color: colorType = {
                id: property,
                itemType: 'event',
                background: eventColor[property]?.background,
                foreground: eventColor[property]?.foreground,
            }
            modifiedColors.push(color)
        }

        for (const integration of calIntegrations) {

            if (integration.name === googleCalendarName) {
                const newIntg = await updateGoogleIntegration(
                    integration.id,
                    true,
                    tokens?.access_token,
                    tokens.refresh_token === null ? undefined : tokens.refresh_token,
                    dayjs(tokens?.expiry_date).format(),
                    true,
                    modifiedColors,
                    undefined,
                    undefined,
                    googleClientTypeForMainWebApp
                )
                console.log(newIntg, ' newIntg')
            } else {
                const newIntg = await updateGoogleIntegration(
                    integration.id,
                    true,
                    tokens?.access_token,
                    tokens.refresh_token === null ? undefined : tokens.refresh_token,
                    dayjs(tokens?.expiry_date).format(),
                    true,
                    undefined,
                    undefined,
                    undefined,
                    googleClientTypeForMainWebApp
                )

                console.log(newIntg, ' newIntg')

                await triggerGooglePeopleSync(
                    integration.id,
                    sub,
                    req,
                )
            }
        }



        return res.redirect('/Auth/google/callback-google-oauth')

    } catch (e) {
        console.log(e, ' unable to auth')
        const errorMessage = e instanceof Error ? e.message : 'Internal server error'
        return res.status(500).json({ statusCode: 500, message: errorMessage })
    }
}