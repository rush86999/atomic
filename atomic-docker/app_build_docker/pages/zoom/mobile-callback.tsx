
import { useToast, Spinner } from '@chakra-ui/react'
import { useEffect, useState } from "react"
import { NextPage, NextApiRequest, NextApiResponse } from "next"
import { ZoomJSONResponseType, ZoomJSONUserResponseType } from "@lib/types"

import { zoomResourceName } from '@lib/constants';
import { getMinimalCalendarIntegrationByResource, updateZoomIntegration } from '@lib/api-backend-helper';

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
    
    
    const thisUrl = new URL(req.url as string, `https://${req.headers.host}`)
    
    if (thisUrl.searchParams.get('code')) {
        const urlParam = thisUrl.searchParams.get('code') as string
        console.log(urlParam, ' code')
        const state = thisUrl.searchParams.get('state') as string
        console.log(state, ' state')
        const userId = state

        // console.log(process.env.ZOOM_CLIENT_ID, ' clientId')
        // console.log(process.env.ZOOM_CLIENT_SECRET, ' clientSecret')
        const data = process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET
        const newData = Buffer.from(data, 'utf8')
        const b64string = newData.toString('base64')
        // console.log(b64string, ' b64string')

        const zoomUrl = new URL('https://zoom.us/oauth/token')
        zoomUrl.searchParams.set('grant_type', 'authorization_code')
        zoomUrl.searchParams.set('code', urlParam)
        // dev only
        zoomUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL as string)
        // zoomUrl.searchParams.set('state', state)

        try {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + b64string
                }
            }
            const response = await fetch(zoomUrl.href, options)  
            const zoomAuthTokens: ZoomJSONResponseType = await response.json()

            // console.log(zoomAuthTokens, ' zoomAuthTokens')

            const newOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + zoomAuthTokens.access_token
                    }
                }
                const preUser = await fetch('https://api.zoom.us/v2/users/me', newOptions)
                const zoomUser: ZoomJSONUserResponseType = await preUser.json()

                console.log(zoomUser, ' zoomUser')
            if (zoomAuthTokens.access_token && userId) {
                
                const zoomIntegration = await getMinimalCalendarIntegrationByResource(userId, zoomResourceName)
                
                if (!zoomIntegration?.id) {
                    throw new Error('zoom integration not found')
                }

                await updateZoomIntegration(
                    zoomIntegration?.id,
                    zoomUser?.account_id,
                    zoomUser?.email,
                    zoomUser?.id,
                    zoomAuthTokens?.access_token,
                    zoomAuthTokens?.expires_in,
                    zoomAuthTokens?.refresh_token,
                    zoomUser?.first_name,
                    zoomUser?.last_name,
                    zoomUser?.phone_country,
                    zoomUser?.phone_number,
                    true,
                )

                return {
                    props: {zoomUser, userId }
                }
            }
        } catch (e) {
            console.log(e, ' unable to get response')
        }
    }

  return {
    props: {},
  }
}

type Props = {
    zoomUser: ZoomJSONUserResponseType,
    userId: string,
    path: string,
}

const ZoomWebCallback: NextPage<Props> = ({ zoomUser, userId }) => {
    // const [url, setUrl] = useState('')
    const [isValid, setIsValid]  = useState<boolean>(true)
    // const router = useRouter()

    const toast = useToast()

    useEffect(() => {
        if (!zoomUser?.id || !userId) {
            toast({
                title: 'Missing info',
                description: "Somehting went wrong with the Auth process. Let us know or try again.",
                status: 'error',
                duration: 9000,
                isClosable: true,
            })
            setIsValid(false)
            return
        }  
        
        
        
    }, [toast, userId, zoomUser?.id])

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full">
            <div className="flex flex-col justify-center items-center text-center sm:text-left lg:my-12 sm:my-8 w-full">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100  sm:text-2xl">
                    {"Success!"}
                </h1>

                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-100">
                    {"Zoom Successfully Authenticated 🎉!"}
                </p>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-100">
                    {"You can close this tab and refresh https://app.atomiclife.app to get updated view"}
                </p>
                {
                !isValid
                    ? (
                        <p className="mt-1.5 text-sm text-red-500">
                            {"Something went wrong with the sync "}
                        </p>
                    ) : null
                }
            </div>
            <Spinner color='pink.500' />
        </div>
    )
}

export default ZoomWebCallback

