import Image from 'next/image'
import type { NextPage } from 'next'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { googleCalendarSyncStartUrl, googleSignInDarkButton, googleSignInNormalButton } from "@lib/constants"
import { useEffect, useState } from 'react'

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

type Props = {
    attendeeId: string,
    meetingId: string,
}

const CalendarSync: NextPage<Props> = (props: Props) => {
    const attendeeId = props?.attendeeId
    const meetingId = props?.meetingId
    const [url, setUrl] = useState('')

    useEffect(() => {
        const makeLink = () => {
            const newUrl = new URL(googleCalendarSyncStartUrl)
            newUrl.searchParams.set('meetingId', meetingId)
            newUrl.searchParams.set('attendeeId', attendeeId)
            setUrl(newUrl.href)
        }
        makeLink()
    }, [attendeeId, meetingId])

    let googleSignInButton = googleSignInNormalButton
    
    if (typeof window !== "undefined") {
        googleSignInButton = window.matchMedia('(prefers-color-scheme: dark)').matches ? googleSignInDarkButton : googleSignInNormalButton
    }
    
    const routeToGoogleCalendarSignIn = (e: { preventDefault: () => void }) => {
        e?.preventDefault()
        const newUrl = new URL(googleCalendarSyncStartUrl)
            newUrl.searchParams.set('meetingId', meetingId)
            newUrl.searchParams.set('attendeeId', attendeeId)
        window.location.href = newUrl.href
        
    }


    return (
        <div className="flex flex-col justify-center items-center h-full w-full">
            <div className=" lg:my-12 sm:my-8 lg:h-1/6 sm:w-1/2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                    {"Sign in to your Google Calendar"}
                </h1>

                <p className="mt-1.5 text-sm text-gray-500">
                    {"Sign in to your Google calendar to sync events and avoid conflict 😊 "}
                </p>
            </div>
            <div className="flex flex-start items-center lg:h-5/6">
                <div>
                    <a href={url} onClick={routeToGoogleCalendarSignIn}>
                        <Image
                            src={googleSignInButton}
                            alt="Google Sign In"
                            width={382}
                            height={92}
                            className="rounded"
                        />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default CalendarSync
