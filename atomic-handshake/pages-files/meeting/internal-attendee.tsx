import { ChangeEvent, useEffect, useRef, useState } from "react"
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import { EmailType, MeetingAssistAttendeeType, MeetingAssistType, UserContactInfoType } from "@lib/types"
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

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
import axios from "axios"

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

const MeetingAssistInternalAttendee: NextPage<Props> = (props: Props) => {
    const [primaryEmail, setPrimaryEmail] = useState<string>(props?.primaryEmail || '')
    const [oldPrimaryEmail, setOldPrimaryEmail] = useState<string>(props?.meetingAssistAttendee?.primaryEmail || '')
    const [name, setName] = useState<string>(props?.meetingAssistAttendee?.name || '')
    const [contactPhone, setContactPhone] = useState<string>('')
    const [contactEmail, setContactEmail] = useState<string>('')
    const [verifiedUser, setVerifiedUser] = useState<boolean>(false)
    const [registeredUser, setRegisteredUser] = useState<UserContactInfoType>()
    const [meetingAttendee, setMeetingAttendee] = useState<MeetingAssistAttendeeType>()
    const [meetingAssist, setMeetingAssist] = useState<MeetingAssistType>()

    const router = useRouter()
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const cancelRef = useRef()

    const hostId = props?.hostId
    const meetingId = props?.meetingId
    const userId = props?.meetingAssistAttendee?.userId
    const attendeeId = props?.attendeeId
    

    useEffect(() => {
        (async () => {
            try {
                if (!primaryEmail) {
                    return
                }

                const userInfo = (await axios.post<UserContactInfoType>('/api/internal-attendee', {
                    method: 'getUserContactInfo',
                    variables: { id: primaryEmail },
                }))?.data

                if (userInfo?.id) {
                    setVerifiedUser(true)
                    setRegisteredUser(userInfo)
                }
            } catch (e) {
                
            }
        })()
    }, [primaryEmail])

    useEffect(() => {
        (async () => {
            try {
                if (!attendeeId) {
                    
                }
                const oldMeetingAttendee: MeetingAssistAttendeeType = (await axios.post('/api/external-attendee', { method: 'getMeetingAssistAttendee', variables: { id: attendeeId } }))?.data
                
                if (oldMeetingAttendee?.id) {
                    setMeetingAttendee(oldMeetingAttendee)
                    if (oldMeetingAttendee?.primaryEmail) {
                      setOldPrimaryEmail(oldMeetingAttendee?.primaryEmail)
                      setPrimaryEmail(oldMeetingAttendee?.primaryEmail)
                    }
                    
                }


            } catch (e) {
                
            }
        })()
    }, [attendeeId])

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
                
            }
        })()
    }, [meetingId, toast])

    const verifyInternalAttendee = async () => {
        try {
            if (!contactPhone && !contactEmail) {
                toast({
                    title: 'Contact info required to verify',
                    description: 'Either registered phone or email is required to verify you are registered with Atomic',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })

                return
            }

            if (contactPhone) {
                const contactPhoneCleaned = contactPhone.replace(/[^\d]/g, '')
                const userInfo = (await axios.post<UserContactInfoType>('/api/internal-attendee', {
                    method: 'getUserContactInfo',
                    variables: { id: contactPhoneCleaned },
                }))?.data

                if (userInfo?.id) {
                    setVerifiedUser(true)
                    setRegisteredUser(userInfo)
                     toast({
                        title: 'User verified',
                        description: 'You have been verified as an Atomic user!',
                        status: 'success',
                        duration: 9000,
                        isClosable: true,
                    })
                    return true
                } else {
                    setVerifiedUser(false)
                     toast({
                        title: 'Contact info required to verify',
                        description: 'Either registered phone or email is required to verify you are registered with Atomic',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    })
                    return false
                }
            } else if (contactEmail) {
                 const userInfo = (await axios.post<UserContactInfoType>('/api/internal-attendee', {
                    method: 'getUserContactInfo',
                    variables: { id: contactEmail },
                 }))?.data
                
                if (userInfo?.id) {
                    setVerifiedUser(true)
                    setRegisteredUser(userInfo)
                    toast({
                        title: 'User verified',
                        description: 'You have been verified as an Atomic user!',
                        status: 'success',
                        duration: 9000,
                        isClosable: true,
                    })
                    return true
                } else {
                    setVerifiedUser(false)
                    toast({
                        title: 'Contact info required to verify',
                        description: 'Either registered phone or email is required to verify you are registered with Atomic',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    })
                    return false
                }
            }
        } catch (e) {
            
        }
    }

    const updateAttendeeInfo = async () => {
        try {
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

            if (!registeredUser?.userId && !userId) {
                toast({
                    title: 'Missing info',
                    description: 'User id is required but missing. Something went wrong somewhere. Let us know',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }
            

            const newAttendee: MeetingAssistAttendeeType = (await axios.post('/api/external-attendee', { method: 'upsertOneMeetingAssistAttendee', variables: { attendee: {
                id: attendeeId,
                name,
                hostId,
                userId: registeredUser?.userId as string ?? userId,
                emails: props?.meetingAssistAttendee
                    ?.emails?.filter(e => (e?.value !== oldPrimaryEmail))
                    ?.filter(e => (!e?.primary))
                    ?.concat([{ primary: true, value: primaryEmail.toLowerCase(), type: 'work', displayName: primaryEmail }]) as EmailType[]
                    || [{ primary: true, value: primaryEmail.toLowerCase(), type: 'work', displayName: primaryEmail }] as EmailType[],
                meetingId,
                createdDate: dayjs().format(),
                timezone: dayjs.tz.guess(),
                updatedAt: dayjs().format(),
                externalAttendee: false,
                primaryEmail,
            }}}))?.data

            setOldPrimaryEmail(newAttendee?.primaryEmail as string)

            if (!oldPrimaryEmail) {

                const newAttendanceCount = (meetingAssist?.attendeeCount || 0) + 1
                const newAttendeeRespondedCount = (meetingAssist?.attendeeRespondedCount || 0) + 1
                
                await axios.post('/api/external-attendee', { method: 'updateMeetingAssistAttendanceCount', variables: { id: meetingId, attendeeCount: newAttendanceCount, attendeeRespondedCount: newAttendeeRespondedCount } })
                
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

            await axios.post('/api/external-attendee', { method: 'deleteMeetingAssistAttendee',
                variables: { id: meetingAttendee?.id }
            })
            
            toast({
                title: 'Confirmation cancelled',
                description: 'Your confirmation is cancelled succesfully',
                status: 'success',
                duration: 9000,
                isClosable: true
            })


            const newAttendanceCount = (meetingAssist?.attendeeCount || 0) - 1 < 0 ? 0 : (meetingAssist?.attendeeCount as number) - 1
            
            await axios.post('api/external-attendee', {
                method: 'updateMeetingAssistAttendanceCount',
                variables: { id: meetingId, attendeeCount: newAttendanceCount, attendeeRespondedCount: meetingAssist?.attendeeRespondedCount },
            })

            if (meetingAssist?.cancelIfAnyRefuse) {
                await axios.post('api/external-attendee', {
                    method: 'cancelMeetingAssist',
                    variables: { id: meetingId },
                })
            }

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
            
        }
        onClose()
    }

    const handleChangeContactPhone = (e: ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)

    const handleChangeContactEmail = (e: ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)

    const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)

    const handleChangeEmail = (e: ChangeEvent<HTMLInputElement>) => setPrimaryEmail(e?.target?.value)

    if (!verifiedUser) {
        return (
            <div className="flex flex-col justify-between items-center h-full w-full">
                <div className=" sm:text-left lg:my-12 sm:my-8">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                        {"Let's confirm you're an Atomic user"}
                    </h1>

                    <p className="mt-1.5 text-sm text-gray-500">
                        {"Submit a phone number or email you registerd with Atomic to confirm! 🎉"}
                    </p>
                </div>
                <div className="mt-1">
                    <label htmlFor="ContactPhone" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                        id="ContactPhone"
                        placeholder="123-456-7890"
                        className="peer invalid:border-pink-500 invalid:text-pink-600  mt-1 w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
                        value={contactPhone}
                        onChange={handleChangeContactPhone}
                    />
                     <p className="invisible peer-invalid:visible text-pink-700 font-light">
                        Please follow the recommended format
                    </p>
                    <p className="mt-1.5 text-sm text-gray-500">Format: 123-456-7890</p>
                </div>
                <div className="mt-6">
                    <label htmlFor="ContactEmail" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Email
                    </label>

                    <input
                        type="email"
                        id="ContactEmail"
                        placeholder="john@email.com"
                        className="peer invalid:border-pink-500 invalid:text-pink-600  mt-1 w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
                        value={contactEmail}
                        onChange={handleChangeContactEmail}
                    />
                     <p className="invisible peer-invalid:visible text-pink-700 font-light dark:text-gray-300">
                        Please enter a valid email address format
                    </p>
                </div>
                <div className="flex justify-center items-center mb-3">
                    <button className='btn btn-primary' onClick={verifyInternalAttendee}>
                        {'Verify Atomic User'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col justify-center items-center h-full w-full">
            <div className="flex flex-col justify-around items-center h-full w-full">
                <div className="sm:text-left lg:my-12 sm:my-8 lg:h-1/6 lg:w-1/2 lg:mx-3 mx-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                        {"Let's confirm your attendance"}
                    </h1>

                    <p className="mt-1.5 text-sm text-gray-500">
                        {"Submit your name and contact information to confirm your attendance! 🎉"}
                    </p>
                </div>
                <div className="flex flex-col justify-around items-center h-5/6 lg:w-1/2">
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
                        <button className='btn btn-ghost'  onClick={onOpen}>
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

export default MeetingAssistInternalAttendee
