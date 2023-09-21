import { ChangeEvent, useEffect, useRef, useState } from "react"
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { v4 as uuid } from 'uuid'
import { EmailType, MeetingAssistAttendeeType, MeetingAssistType } from "@lib/types"
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
// import { cancelMeetingAssist, deleteMeetingAssistAttendee, getMeetingAssist, getMeetingAssistAttendee, getMeetingAssistAttendeeByEmail, upsertOneMeetingAssistAttendee, updateMeetingAssistAttendanceCount } from "@lib/api-helper"

import axios from 'axios'
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    useDisclosure,
    useToast
} from '@chakra-ui/react'


dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

type Props = {
    meetingAssistAttendee?: MeetingAssistAttendeeType,
    hostId: string,
    primaryEmail?: string,
    meetingId: string,
    attendeeId: string,
}
const MeetingAssistExternalAttendee: NextPage<Props> = (props: Props) => {
    const [primaryEmail, setPrimaryEmail] = useState<string>(props?.primaryEmail || '')
    const [oldPrimaryEmail, setOldPrimaryEmail] = useState<string>(props?.meetingAssistAttendee?.primaryEmail || '')
    const [name, setName] = useState<string>(props?.meetingAssistAttendee?.name || '')
    const [meetingAttendee, setMeetingAttendee] = useState<MeetingAssistAttendeeType>()
    const [meetingAssist, setMeetingAssist] = useState<MeetingAssistType>()
    
    // const router = useRouter()
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = useRef()
    
    const hostId = props?.hostId
    const meetingId = props?.meetingId
    const userId = props?.meetingAssistAttendee?.userId
    const attendeeId = props?.attendeeId

    console.log(hostId, ' hostId')
    console.log(userId, ' userId')

    // get old meeting assist attendee
    useEffect(() => {
        (async () => {
            try {
                if (!attendeeId) {
                    console.log('no attendeeId present to get old meeting attendee info')
                    return
                }

                const oldMeetingAttendee: MeetingAssistAttendeeType = (await axios.post('/api/external-attendee', { method: 'getMeetingAssistAttendee', variables: { id: attendeeId  }}))?.data
                console.log(oldMeetingAttendee, ' oldMeetingAttendee')
                if (oldMeetingAttendee?.id) {
                    setMeetingAttendee(oldMeetingAttendee)
                    if (oldMeetingAttendee?.primaryEmail) {
                      setOldPrimaryEmail(oldMeetingAttendee?.primaryEmail)
                      setPrimaryEmail(oldMeetingAttendee?.primaryEmail)
                    }
                    
                }


            } catch (e) {
                console.log(e, ' unable to get old meeting attendee')
            }
        })()
    }, [attendeeId])

    // get meetingAssist
    useEffect(() => {
        (async () => {
            try {
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
                console.log(e, ' unable to get meeting assist')
            }
        })()
    }, [meetingId, toast])

    const updateAttendeeInfo = async () => {
        try {
            // validate
            if (!name) {
                toast({
                    title: 'Name required.',
                    description: "Name is required to confirm attendence.",
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (!primaryEmail) {
                toast({
                    title: 'Email is required',
                    description: 'Email is required to confirm attendence',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }
            // delete old attendee if any
            // if (oldPrimaryEmail) {
            //     if (primaryEmail !== oldPrimaryEmail) {
            //         await deleteMeetingAssistAttendee(attendeeId)
            //     }
            // }
            
            // add new attendee info
            const newAttendee: MeetingAssistAttendeeType = (await axios.post('/api/external-attendee', { method: 'upsertOneMeetingAssistAttendee', variables: { attendee: {
                id: attendeeId,
                name,
                hostId,
                userId: userId || uuid(),
                emails: props?.meetingAssistAttendee
                    ?.emails?.filter(e => (e?.value !== oldPrimaryEmail))
                    ?.filter(e => (!e?.primary))
                    ?.concat([{ primary: true, value: primaryEmail.toLowerCase().trim(), type: 'work', displayName: primaryEmail }]) as EmailType[]
                    || [{ primary: true, value: primaryEmail.toLowerCase().trim(), type: 'work', displayName: primaryEmail }] as EmailType[],
                meetingId,
                createdDate: dayjs().format(),
                timezone: dayjs.tz.guess(),
                updatedAt: dayjs().format(),
                externalAttendee: true,
                primaryEmail,
            }}}))?.data

            setOldPrimaryEmail(newAttendee?.primaryEmail as string)

            if (!oldPrimaryEmail) {
                // new attendance count

                const meetingAssist: MeetingAssistType = (await axios.post('/api/external-attendee', { method: 'getMeetingAssist', variables: { id: meetingId  }}))?.data

                const newAttendanceCount = (meetingAssist?.attendeeCount || 0) + 1
                const newAttendeeRespondedCount = (meetingAssist?.attendeeRespondedCount || 0) + 1
                
                // await updateMeetingAssistAttendanceCount(meetingId, newAttendanceCount)
                await axios.post('/api/external-attendee', { method: 'updateMeetingAssistAttendanceCount', variables: { id: meetingId, attendeeCount: newAttendanceCount, attendeeRespondedCount: newAttendeeRespondedCount }})
                
                // update invite response
                await axios.post('/api/external-attendee', {
                    method: 'updateMeetingAssistInviteResponse',
                    variables: { id: attendeeId, response: 'ATTENDING' },
                })
            }

            setMeetingAttendee(newAttendee)
            
            toast({
                title: 'Successfully updated',
                description: 'You have sucessfully updated attendance information. Please proceed to the next step.',
                status: 'success',
                duration: 9000,
                isClosable: true
            })
           
        } catch (e) {
            toast({
                    title: 'Oops...',
                    description: 'Something went wrong, let us know so we can work on it',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
            console.log(e, ' unable to update attendee info')

        }
    }

    const cancelConfirmation = async () => {
        try {
            if (!primaryEmail) {
               toast({
                    title: 'No email present',
                    description: 'Seems like there is no email to cancel confirmation',
                    status: 'warning',
                    duration: 9000,
                    isClosable: true
               })
                return
            }

            // const oldAttendee = await getMeetingAssistAttendee(attendeeId)
            
            if (!meetingAttendee?.id) {
                toast({
                    title: 'No registration present',
                    description: 'Seems like there is no registration to cancel confirmation',
                    status: 'warning',
                    duration: 9000,
                    isClosable: true
                })
                return
            } 

            // await deleteMeetingAssistAttendee(meetingAttendee?.id)
            // meetingAttendee?.id
            await axios.post('/api/external-attendee', { method: 'deleteMeetingAssistAttendee',
                variables: { id: meetingAttendee?.id } })

            toast({
                title: 'Confirmation cancelled',
                description: 'Your confirmation is cancelled succesfully. You may close the window if you wish.',
                status: 'success',
                duration: 9000,
                isClosable: true
            })

            // new attendance count

            const newAttendanceCount = (meetingAssist?.attendeeCount || 0) - 1 < 0 ? 0 : (meetingAssist?.attendeeCount as number) - 1
            
            // await updateMeetingAssistAttendanceCount(meetingId, newAttendanceCount)

            await axios.post('api/external-attendee', {
                method: 'updateMeetingAssistAttendanceCount',
                variables: { id: meetingId, attendeeCount: newAttendanceCount, attendeeRespondedCount: meetingAssist?.attendeeRespondedCount },
            })

            if (meetingAssist?.cancelIfAnyRefuse) {
                // await cancelMeetingAssist(meetingId)
                await axios.post('api/external-attendee', {
                    method: 'cancelMeetingAssist',
                    variables: { id: meetingId },
                })
            }

            // update invite response
            await axios.post('/api/external-attendee', {
                method: 'updateMeetingAssistInviteResponse',
                variables: { id: attendeeId, response: 'CANCELLED' },
            })

            
            
        } catch (e) {
            toast({
                title: 'Oops...',
                description: 'Something went wrong, let us know so we can work on it',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            console.log(e, ' unable to cancel confirmation')
        }
        onClose()
    }

    const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => setPrimaryEmail(e?.target?.value)

    const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)

    return (
        <div className="flex flex-col justify-center items-center h-full w-full">
            <div className="flex flex-col justify-around items-center h-full w-full">
                <div className=" sm:text-left lg:my-12 sm:my-8 lg:h-1/6 lg:w-1/2 lg:mx-3 mx-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                        {"Let's confirm your attendance"}
                    </h1>

                    <p className="mt-1.5 text-sm text-gray-500">
                        {"Submit your name and contact information to confirm your attendance! 🎉"}
                    </p>
                </div>
                <div className="flex flex-col justify-around items-center lg:h-5/6 lg:w-1/2">
                    <div>
                        <div>
                            <label htmlFor="Name" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Name
                            </label>

                            <input
                                type="text"
                                id="Name"
                                placeholder="john"
                                className="text-gray-900 peer invalid:border-pink-500 invalid:text-pink-600  mt-1 w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
                                value={name}
                                required
                                onChange={handleChangeName}
                            />
                            <p className="invisible peer-invalid:visible text-pink-700 font-light">
                                Please enter your name for attendence confirmation
                            </p>
                        </div>
                        <div>
                            <label htmlFor="UserEmail" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>

                            <input
                                type="email"
                                id="UserEmail"
                                placeholder="john@rhcp.com"
                                className="text-gray-900 peer invalid:border-pink-500 invalid:text-pink-600  mt-1 w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
                                value={primaryEmail}
                                onChange={handleChangeEmail}
                                required
                            />
                            <p className="invisible peer-invalid:visible text-pink-700 font-light">
                                Please enter a valid email address
                            </p>
                        </div>
                    </div>
                    <div className="m-auto my-2 w-1/2 lg:flex lg:justify-center lg:items-center lg:space-x-4 lg:w-full">
                        <button className='btn btn-ghost' onClick={cancelConfirmation}>
                            {'Cancel Confirmation'}
                        </button>
                        <button className='btn btn-primary' onClick={updateAttendeeInfo}>
                            {'Confirm Attendance'}
                        </button>
                        
                    </div>
                </div>
            </div>
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef as any}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Cancel Confirmation
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {"Are you sure? Your confirmation will be cancelled"}
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <button className='btn btn-ghost' ref={cancelRef as any} onClick={onClose}>
                                Cancel
                            </button>
                            <button className='btn ml-3' onClick={cancelConfirmation}>
                                Delete
                            </button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </div>
    )
}

export default MeetingAssistExternalAttendee
