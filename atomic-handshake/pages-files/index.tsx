import { useEffect, useState } from "react"
import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { MeetingAssistAttendeeType, MeetingAssistType } from "@lib/types"
import { useToast } from "@chakra-ui/react"
import MeetingAssistExternalAttendee from './meeting/external-attendee';
import MeetingAssistInternalAttendee from "./meeting/internal-attendee"
import { messyDoodleSVG } from "@lib/constants"
import CalendarSync from "./meeting/calendar-sync"
import MeetingAssistTimePreferences from "./meeting/time-preferences"
import styles from '../styles/Home.module.css'
import axios from "axios"
const Handshake: NextPage = () => {
    const [meetingAssist, setMeetingAssist] = useState<MeetingAssistType>()
    const [meetingAssistAttendee, setMeetingAssistAttendee] = useState<MeetingAssistAttendeeType>()
    const [isExternalUser, setIsExternalUser] = useState<boolean>(false)
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>(-1)

    const router = useRouter()
    const toast = useToast()
    
    const meetingId: string = router?.query?.meetingId as string
    const attendeeId: string = router?.query?.attendeeId as string
    const calendarSyncCompleted: boolean = router?.query?.calendarSyncCompleted === 'true'
    const primaryEmail: string = router?.query?.primaryEmail as string

    
    

    useEffect(() => {
        (async () => {
            try {
                if (typeof meetingId !== 'string') {
                    
                    return
                }
                const oldMeetingAssist: MeetingAssistType = (await axios.post('/api/external-attendee', { method: 'getMeetingAssist', variables: { id: meetingId  }}))?.data
                setMeetingAssist(oldMeetingAssist)

                if (oldMeetingAssist?.cancelIfAnyRefuse) {
                    toast({
                        title: 'Meeting cancelled',
                        description: 'The meeting has been called',
                        status: 'warning',
                        duration: 9000,
                        isClosable: true
                    })
                }
            } catch (e) {
                
            }
        })()
    }, [meetingId, toast])

    useEffect(() => {
        (async () => {
            try {
                if (!attendeeId) {
                    return
                }

                const oldMeetingAttendee: MeetingAssistAttendeeType = (await axios.post('/api/external-attendee', { method: 'getMeetingAssistAttendee', variables: { id: attendeeId } }))?.data
                
                if (oldMeetingAttendee?.id) {
                    setMeetingAssistAttendee(oldMeetingAttendee)    
                }
                
            } catch (e) {
                
            }
        })()
    }, [attendeeId])

    

    useEffect(() => {
        (() => {
            if (calendarSyncCompleted) {
                setActiveIndex(3)
                setCompletedStep(2)
            } else {
                setActiveIndex(0)
                setCompletedStep(-1)
            }
        })()
    }, [calendarSyncCompleted])

    const goToPrevStep = () => {
        const prevActiveIndex = activeIndex
        let newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1

        if ((prevActiveIndex === 3) && !isExternalUser) {
            newActiveIndex = prevActiveIndex - 2
        }
        setActiveIndex(newActiveIndex)
    }

    

    const renderPrevButton = () => {
        if (activeIndex === 0) {
            return <div className="lg:m-2 sm:m-3" />
        }

        return (
            <div className="lg:m-2 sm:m-3">
                <button className='btn' onClick={goToPrevStep}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
            </div>
        )
    }

    const goToNextStep = () => {
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep

        if (prevActiveIndex === 3) {
            return
        }

        if ((prevActiveIndex === 1) && !isExternalUser) {
            let newActiveIndex = prevActiveIndex + 2
            
            if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
                const newCompletedStep = prevActiveIndex + 1
                setCompletedStep(newCompletedStep)
            }

            if (newActiveIndex !== prevActiveIndex) {
                setActiveIndex(newActiveIndex)
            }

            return

        }

        let newActiveIndex = prevActiveIndex + 1

        if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
            const newCompletedStep = prevActiveIndex
            setCompletedStep(newCompletedStep)
        }

        if (newActiveIndex !== prevActiveIndex) {
            setActiveIndex(newActiveIndex)
        }
    }

    const renderNextButton = () => {
        if (activeIndex === 3) {
            return <div className="lg:m-2 sm:m-3" />
        }

        if (activeIndex === 0) {
            return <div className="lg:m-2 sm:m-3" />
        }

        return (
        <div className="lg:m-2 sm:m-3">
            <button className='btn' onClick={goToNextStep}>
                Next
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        )
    }

    const goToExternalUser= () => {
        setIsExternalUser(true)
        goToNextStep()
    }

    const goToInternalUser = () => {
        setIsExternalUser(false)
        goToNextStep()
    }


    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <div className="flex flex-col justify-center items-center h-full lg:w-full">
                        <div className="m-8 sm:text-left lg:my-12 sm:my-8 lg:h-1/4 lg:w-1/2">
                            <h1 className="  text-xl font-bold text-gray-900 dark:text-gray-300 sm:text-2xl">
                                {"Welcome, do you use Atomic?"}
                            </h1>

                            <p className=" mt-1.5 text-sm text-gray-500 dark:text-gray-300">
                                {"If you use Atomic, we can use your account to help find a flexible schedule for everyone involved! 🎉"}
                            </p>
                        </div>
                        <div className="flex flex-col justify-center items-center lg:h-3/4 lg:w-3/4">
                            
                            <div className="flex flex-col flex-start items-center lg:space-y-4 sm:space-y-5">
                                <div>
                                    <button className='btn btn-primary m-2' onClick={goToExternalUser}>
                                        {"I don't use Atomic"}
                                    </button>
                                </div>
                                <div>
                                    <button className='btn btn-primary m-2' onClick={goToInternalUser}>
                                        {"I'm an Atomic User"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 1:
                return (
                    <div className="flex flex-col justify-center items-center h-full w-full">
                        {
                            isExternalUser && meetingAssist?.userId
                                ? (
                                    <div className="flex flex-col justify-center items-center h-full w-full">
                                        <div className=" flex flex-col justify-center items-center h-full w-full">
                                            <MeetingAssistExternalAttendee
                                                meetingAssistAttendee={meetingAssistAttendee}
                                                hostId={meetingAssist?.userId}
                                                primaryEmail={primaryEmail}
                                                meetingId={meetingId}
                                                attendeeId={attendeeId}
                                            />
                                        </div>
                                        <div className="my-2 flex justify-between items-center w-3/4">
                                            {renderPrevButton()}
                                            {renderNextButton()}
                                        </div>
                                    </div>
                                ) :
                                    meetingAssist?.userId ? (
                                        <div className="flex flex-col justify-center items-center w-full">
                                            <div className=" flex flex-col justify-center items-center w-full">
                                                <MeetingAssistInternalAttendee
                                                    meetingAssistAttendee={meetingAssistAttendee}
                                                    hostId={meetingAssist?.userId}
                                                    primaryEmail={primaryEmail}
                                                    meetingId={meetingId}
                                                    attendeeId={attendeeId}
                                                />
                                            </div>
                                            <div className="my-2 flex justify-between items-center w-3/4">
                                                {renderPrevButton()}
                                                {renderNextButton()}
                                            </div>
                                        </div>
                                ) : (
                                        <div className="flex flex-col h-full w-full justify-center items-center">
                                            <div className="mt-16 grid h-full place-content-center w-full">
                                                <div className="text-center">
                                                    <Image
                                                        src={messyDoodleSVG}
                                                        alt="messy doodle svg"
                                                        width={512}
                                                        height={384}
                                                    />

                                                    <h1
                                                        className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-200 sm:text-4xl"
                                                    >
                                                    Loading... Please wait
                                                    </h1>

                                                    <p className="mt-4 text-gray-500">{"We are loading the page. Pleaes wait."}</p>
                                                </div>
                                            </div>
                                            <div className="my-2 flex justify-between items-center w-3/4">
                                            {renderPrevButton()}
                                            <div />
                                        </div>
                                        </div>
                                    )
                        }
                    </div>
                )
            
            case 2:
                return (
                    <div className="flex flex-col justify-center items-center h-full w-full">
                        <CalendarSync
                            meetingId={meetingId}
                            attendeeId={attendeeId}
                        />
                        <div className="my-2 flex justify-between items-center w-3/4">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="flex flex-col justify-center items-center h-full w-full">
                        <MeetingAssistTimePreferences
                            meetingId={meetingId}
                            attendeeId={attendeeId}
                        />
                        <div className="my-2 flex justify-between items-center w-3/4">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="h-full flex flex-col justify-center items-center w-full">
            <Head>
                <title>Atomic | Save time planning your Google calendar</title>
                <meta name="Description" content="Save time " />
                <meta name="theme-color" content="#9d0191" />
                <meta
                    name="keywords"
                    content="meeting assist, meeting, schedule a meeting, scheduling, Atomic, planner for google calendar, google calendar, schedule assist, artificial intelligence, AI scheduler, smart tags, integrate with google calendar"
                />
          
            </Head>
            <div className="h-screen flex flex-col justify-center items-center w-full">
                {renderStep()}
            </div>
            <footer className={styles.footer}>
                <a
                    href="https://atomiclife.app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <span className={styles.logo}>
                    <Image src="/1024.png" alt="Atomic Logo" width={16} height={16} />
                    </span>
                </a>
            </footer>
        </div>
    )
}

export default Handshake