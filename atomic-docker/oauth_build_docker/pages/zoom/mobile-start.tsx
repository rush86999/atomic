import { zoomAuthUrl } from "@lib/constants"
import { Icon, Button } from '@chakra-ui/react'
import { useEffect, useState } from "react"
import { NextPage } from "next"
import { useRouter } from "next/router"


const ZoomIcon = (props: any) => (
    <Icon viewBox="0 0 1329.08 1329.08" {...props}>
        <path d="M664.54 0c367.02 0 664.54 297.52 664.54 664.54s-297.52 664.54-664.54 664.54S0 1031.56 0 664.54 297.52 0 664.54 0z" fill="#e5e5e4" fillRule="nonzero" /><path className="fil1" d="M664.54 12.94c359.87 0 651.6 291.73 651.6 651.6s-291.73 651.6-651.6 651.6-651.6-291.73-651.6-651.6 291.74-651.6 651.6-651.6z" /><path d="M664.54 65.21c331 0 599.33 268.33 599.33 599.33 0 331-268.33 599.33-599.33 599.33-331 0-599.33-268.33-599.33-599.33 0-331 268.33-599.33 599.33-599.33z" fill="#4a8cff" fillRule="nonzero" /><path className="fil1" d="M273.53 476.77v281.65c.25 63.69 52.27 114.95 115.71 114.69h410.55c11.67 0 21.06-9.39 21.06-20.81V570.65c-.25-63.69-52.27-114.95-115.7-114.69H294.6c-11.67 0-21.06 9.39-21.06 20.81zm573.45 109.87l169.5-123.82c14.72-12.18 26.13-9.14 26.13 12.94v377.56c0 25.12-13.96 22.08-26.13 12.94l-169.5-123.57V586.64z" />
    </Icon>
)
const ZoomMobileStart: NextPage = () => {
    const [url, setUrl] = useState('')
    const router = useRouter()

    const userId = router?.query?.userId as string
    const path = router?.query?.path as string

    useEffect(() => {
        const makeLink = () => {
            const newUrl = new URL(zoomAuthUrl)
            newUrl.searchParams.set('response_type', 'code')
            // dev only
            newUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL as string)
            // prod - ZOOM_REDIRECT_URI
            newUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID as string)
            if (path?.length > 0) {
                newUrl.searchParams.set('state', `${userId}#${path}`)
            } else {
                newUrl.searchParams.set('state', userId)
            }
            
            setUrl(newUrl.href)
        }
        makeLink()
    }, [path, userId])

    const routeToZoomAuth = (e: { preventDefault: () => void }) => {
        e?.preventDefault()
        // https://zoom.us/oauth/authorize?response_type=code&client_id=OrxpodmORP2eDHug8x0jbQ&redirect_uri=https://oauth.atomiclife.app/api/integrations/zoomvideo/callback
        const newUrl = new URL(zoomAuthUrl)
        newUrl.searchParams.set('response_type', 'code')
        // dev only
        newUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL as string)
        newUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID as string)
        if (path?.length > 0) {
            newUrl.searchParams.set('state', `${userId}#${path}`)
        } else {
            newUrl.searchParams.set('state', userId)
        }
        window.location.href = newUrl.href
    }

    return (
        <div className="flex justify-center items-center h-screen w-full dark:bg-black">
            <a href={url} onClick={routeToZoomAuth}>
                <Button leftIcon={<ZoomIcon />} colorScheme='messenger' variant='solid'>
                    Start Zoom OAuth
                </Button>
            </a>
        </div>
    )

}

export default ZoomMobileStart
