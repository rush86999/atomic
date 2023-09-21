import { zoomAuthUrl } from "@lib/constants"
import { Icon, Button } from '@chakra-ui/react'
import { useEffect, useState } from "react"
import { NextPage } from "next"
import { useRouter } from "next/router"
import Image from 'next/image'
import appStoreAndroid from 'public/images/appStoreAndroid.png'
import appStoreIos from 'public/images/appStoreIos.png'

import { useAppContext } from "@lib/user-context"
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
import Session from 'supertokens-node/recipe/session'


const ZoomIcon = (props: any) => (
    <Icon viewBox="0 0 1329.08 1329.08" {...props}>
        <path d="M664.54 0c367.02 0 664.54 297.52 664.54 664.54s-297.52 664.54-664.54 664.54S0 1031.56 0 664.54 297.52 0 664.54 0z" fill="#e5e5e4" fillRule="nonzero" /><path className="fil1" d="M664.54 12.94c359.87 0 651.6 291.73 651.6 651.6s-291.73 651.6-651.6 651.6-651.6-291.73-651.6-651.6 291.74-651.6 651.6-651.6z" /><path d="M664.54 65.21c331 0 599.33 268.33 599.33 599.33 0 331-268.33 599.33-599.33 599.33-331 0-599.33-268.33-599.33-599.33 0-331 268.33-599.33 599.33-599.33z" fill="#4a8cff" fillRule="nonzero" /><path className="fil1" d="M273.53 476.77v281.65c.25 63.69 52.27 114.95 115.71 114.69h410.55c11.67 0 21.06-9.39 21.06-20.81V570.65c-.25-63.69-52.27-114.95-115.7-114.69H294.6c-11.67 0-21.06 9.39-21.06 20.81zm573.45 109.87l169.5-123.82c14.72-12.18 26.13-9.14 26.13 12.94v377.56c0 25.12-13.96 22.08-26.13 12.94l-169.5-123.57V586.64z" />
    </Icon>
)

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse}) {
  // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
    // const SSR = withSSRContext({ req })
    // this runs on the backend, so we must call init on supertokens-node SDK
    supertokensNode.init(backendConfig())
    let session
    try {
        session = await Session.getSession(req, res, {
            overrideGlobalClaimValidators: async function () {
                return []
            },
        })
    } catch (err: any) {
        if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
            return { props: { fromSupertokens: 'needs-refresh' } }
        } else if (err.type === Session.Error.UNAUTHORISED) {
            // this will force the frontend to try and refresh which will fail
            // clearing all cookies and redirecting the user to the login screen.
            return { props: { fromSupertokens: 'needs-refresh' } }
        }
        throw err
    }

    if (!session?.getUserId()) {
        return {
            redirect: {
                destination: '/User/Login/UserLogin',
                permanent: false,
            },
        }
    }


  return {
    props: {
      sub: session?.getUserId(),
    }
  }
}

const ZoomWebStart: NextPage = () => {
    const [url, setUrl] = useState('')
    const router = useRouter()

    const { sub } = useAppContext()
    const userId = sub

    useEffect(() => {
        const makeLink = () => {
            const newUrl = new URL(zoomAuthUrl)
            newUrl.searchParams.set('response_type', 'code')
            // dev only
            newUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL as string)
            // prod - ZOOM_REDIRECT_URI
            newUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID as string)
            newUrl.searchParams.set('state', userId)
            
            setUrl(newUrl.href)
        }
        makeLink()
    }, [userId])

    const routeToZoomAuth = (e: { preventDefault: () => void }) => {
        e?.preventDefault()
        // https://zoom.us/oauth/authorize?response_type=code&client_id=OrxpodmORP2eDHug8x0jbQ&redirect_uri=https://oauth.atomiclife.app/api/integrations/zoomvideo/callback
        const newUrl = new URL(zoomAuthUrl)
        newUrl.searchParams.set('response_type', 'code')
        // dev only
        newUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL as string)
        newUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID as string)
        newUrl.searchParams.set('state', userId)
        window.location.href = newUrl.href
    }

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full dark:bg-black" style={{ minHeight: '70vh'}}>
            <a href={url}  onClick={routeToZoomAuth}>
                <Button leftIcon={<ZoomIcon />} colorScheme='messenger' bg="purple.700" variant='solid'>
                    <span className="text-black">Start Zoom OAuth</span>
                </Button>
            </a>
            <p className="mt-1.5 text-sm text-gray-500">
                {"Zoom authentication via Web is not tested yet. You can use mobile if this doesn't work. 😊 "}
            </p>
            <div className="flex items-center justify-between mt-3">
                <a href="https://apps.apple.com/us/app/atomic-life/id1594368125" className="pr-2">
                    <Image width={177} src={appStoreIos} alt="App Store" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.atomiclifenoexpo" className="pl-2">
                    <Image width={177} src={appStoreAndroid} alt="App Store" />
                </a>
            </div>
        </div>
    )

}

export default ZoomWebStart
