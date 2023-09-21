import React, { useState, useEffect } from 'react'
import Wizard from '@components/Wizard'

import { useToast } from '@chakra-ui/react'
import { dayjs } from '@lib/date-utils'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'

import {
  CategoryType
} from '@lib/dataTypes/CategoryType'
import {
  listUserCategories,
} from '@lib/Category/CategoryHelper'

import {
  zoomAvailable
} from '@lib/zoom/zoomMeetingHelper'
import {
  googleMeetAvailable,
} from '@lib/calendarLib/googleCalendarHelper'
import { Person, RecurrenceFrequencyType } from '@lib/Calendar/types'
import { VisibilityType } from '@lib/calendarLib/types'
import { createNewEvent } from '@lib/Calendar/UserCreateCalendarHelper'

import CreateEventAttendees from '@pages/Calendar/CreateEventWizard/CreateEventAttendees'
import CreateEventBaseStep from '@pages/Calendar/CreateEventWizard/CreateEventBaseStep'
import CreateEventBaseStep2 from '@pages/Calendar/CreateEventWizard/CreateEventBaseStep2'
import CreateEventRecurStep from '@pages/Calendar/CreateEventWizard/CreateEventRecurStepAlt'
import CreateEventVirtualMeet from '@pages/Calendar/CreateEventWizard/CreateEventVirtualMeet'
import CreateEventVisibilityAndAlarmsStep from '@pages/Calendar/CreateEventWizard/CreateEventVisibilityAndAlarmsStep'
import CreateEventAddCategories from '@pages/Calendar/CreateEventWizard/CreateEventAddCategories'

import { CalendarType } from '@lib/dataTypes/CalendarType'
import { Day } from '@lib/Schedule/constants'
import getGlobalPrimaryCalendar from '@lib/apollo/gql/getGlobalPrimaryCalendar'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'

import { SlotInfo } from 'react-big-calendar'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
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
      sub: session.getUserId(),
    }
  }
}

type Props = {
  start: Date,
  end: Date,
  closeCreateEvent: () => void,
  client: ApolloClient<NormalizedCacheObject>,
  sub: string,
}

function UserCreateEvent(props: Props) {


  const client = props?.client

  const [tags, setTags] = useState<CategoryType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([])
  const [title, setTitle] = useState<string>()
  const [allDay, setAllDay] = useState<boolean>(false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(new Date())
  const [frequency, setFrequency] = useState<RecurrenceFrequencyType>()
  const [interval, setInterval] = useState<string>()
  const [alarms, setAlarms] = useState<number[]>([])
  const [notes, setNotes] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [isZoomAvailable, setIsZoomAvailable] = useState<boolean>(false)
  const [isGoogleMeetAvailable, setIsGoogleMeetAvailable] = useState<boolean>(false)
  const [zoomMeet, setZoomMeet] = useState<boolean>(false)
  const [googleMeet, setGoogleMeet] = useState<boolean>(false)
  const [zoomPrivateMeeting, setZoomPrivateMeeting] = useState<boolean>(false)
  const [attendees, setAttendees] = useState<Person[]>([])
  const [visibility, setVisibility] = useState<VisibilityType>('default')
  const [isAttendees, setIsAttendees] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>()
  const [calendar, setCalendar] = useState<CalendarType>()
  const [isBreak, setIsBreak] = useState<boolean>(false)
  const [byWeekDay, setByWeekDay] = useState<Day[]>([])
  const [startDate, setStartDate] = useState<Date>(props?.start)
  const [endDate, setEndDate] = useState<Date>(props?.end)

  const userId = props?.sub
  const closeCreateEvent = props?.closeCreateEvent
  const toast = useToast()
  
  useEffect(() => {
    (async() => {
      try {
        if (!userId || !client) {
          return
        }
        const results = await listUserCategories(client, userId)
        if (!results?.[0]?.id) {
          console.log(' no categories available')
          return
        }
        setTags(results)
      } catch(e) {
        console.log(e, ' unable to get categories')
      }
    })()
  }, [client, userId])

  useEffect(() => {
    (async () => {
      if (!userId || !client) {
        return
      }
      const isAvailable = await zoomAvailable(client, userId)
      if (isAvailable) {
        setIsZoomAvailable(true)
      }
    })()
  }, [client, userId])

  useEffect(() => {
    (async () => {
      if (!userId || !client) {
        return
      }
      const isAvailable = await googleMeetAvailable(client, userId)
      if (isAvailable) {
        setIsGoogleMeetAvailable(isAvailable)
      }
    })()
  }, [client, userId])

  useEffect(() => {
    (async () => {  
      if (!userId || !client) {
        return
      }
      const result = (await client.query<{ Calendar: CalendarType[] }>({
        query: getGlobalPrimaryCalendar, 
        variables: {
          userId,
        },
      })).data?.Calendar?.[0]
      if (!result?.id) {
        console.log(' no primary calendar available')
        return
      }
      setSelectedCalendarId(result?.id)
      setCalendar(result)
    })()
  }, [client, userId])
  const createEventForUser = async () => {
    try {
      if (!userId || !client) {
        return
      }
      await createNewEvent(
        dayjs(startDate).format(),
        dayjs(endDate).format(),
        userId,
        client,
        selectedCalendarId,
        selectedCategories?.map(category => category.id),
        title,
        allDay,
        dayjs(recurringEndDate).format(),
        frequency,
       parseInt (interval, 10),
        alarms,
        notes,
        location ? { title: location } : undefined,
        false,
        false,
        false,
        true,
        undefined,
        undefined,
        undefined,
        false,
        dayjs.tz.guess(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        zoomMeet,
        googleMeet,
        'scheduled',
        undefined,
        zoomPrivateMeeting,
        attendees,
        undefined,
        undefined,
        undefined,
        undefined,
        title,
        'opaque',
        visibility,
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        dayjs.tz.guess(),
        calendar?.backgroundColor,
        calendar?.foregroundColor,
        alarms?.length > 0 ? false : true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        isBreak,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        undefined,
        undefined,
        alarms?.length > 0,
        undefined,
        true,
        undefined,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        dayjs.duration(dayjs(endDate).diff(dayjs(startDate))).asMinutes(),
        undefined,
        undefined,
        'create',
        undefined,
        byWeekDay,
        1
      )

      toast({
        status: 'success',
        title: 'Event Created',
        description: 'Event created successfully',
        duration: 9000,
        isClosable: true,
      })
      closeCreateEvent()
    } catch (e) {
      console.log(e, ' createEventForUser')
      toast({
        status: 'error',
        title: 'Something went wrong',
        description: 'Event was not created',
        duration: 9000,
        isClosable: true,
      })
    }
  }

  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex
    const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
    setActiveIndex(newActiveIndex)
  }

  const renderPrevButton = () => {
    if (activeIndex === 0) {
      return <Box pt={{ phone: 'm', tablet: 's' }}/>
    }

    return (
    <Box p={{ phone: 's', tablet: 'm' }}>
      <Button onClick={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}

  const goToNextStep = () => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep
    if (!isRecurring && isAttendees) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 1) {
        newActiveIndex = 3
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          toast({
            status: 'info',
            title: 'No categories available',
            description: 'Please add at least one category in your settings in order to add to your event',
            duration: 9000,
            isClosable: true,
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }

    }

    if (!isAttendees && isRecurring) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 2) {
        newActiveIndex = 5
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          toast({
            status: 'info',
            title: 'No categories available',
            description: 'Please add at least one category in your settings in order to add to your event',
            duration: 9000,
            isClosable: true,
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
    }

    if (!isAttendees && !isRecurring) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 1) {
        newActiveIndex = 5
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          toast({
            status: 'info',
            title: 'No categories available',
            description: 'Please add at least one category in your settings in order to add to your event',
            duration: 9000,
            isClosable: true,
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
    }

    if (prevActiveIndex === 7) {
      return
    }

    let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          toast({
            status: 'info',
            title: 'No categories available',
            description: 'Please add at least one category in your settings in order to add to your event',
            duration: 9000,
            isClosable: true,
          })
           newActiveIndex = 7
        }
      }

    if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
      const newCompletedStep = prevActiveIndex
      setCompletedStep(newCompletedStep)
    }

    if (newActiveIndex !== prevActiveIndex) {
      setActiveIndex(newActiveIndex)
    }
  }

  const renderNextButton = () => {
    if (activeIndex === 7) {
      return <Box pt={{ phone: 'm', tablet: 's' }}/>
    }

    return (
      <Box p={{ phone: 's', tablet: 'm' }}>
        <Button onClick={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const renderCurrentStep = () => {
     switch(activeIndex) {
      case 0:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventBaseStep
              title={title}
              notes={notes}
              location={location}
              setParentTitle={setTitle}
              setParentNotes={setNotes}
              setParentLocation={setLocation}
              startDate={startDate}
              endDate={endDate}
              setParentEndDate={setEndDate}
              setParentStartDate={setStartDate}
            />
            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
              <Box />
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 1: 
      return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventBaseStep2
              allDay={allDay}
              isRecurring={isRecurring}
              isAttendees={isAttendees}
              isBreak={isBreak}
              setParentAllDay={setAllDay}
              setParentIsRecurring={setIsRecurring}
              setParentIsAttendees={setIsAttendees}
              setParentIsBreak={setIsBreak}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventRecurStep
              recurringEndDate={recurringEndDate}
              setParentRecurringEndDate={setRecurringEndDate}
              frequency={frequency}
              setParentFrequency={setFrequency}
              interval={interval}
              setParentInterval={setInterval}
              byWeekDay={byWeekDay}
              setParentWeekDay={setByWeekDay}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 3:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventVirtualMeet
              isZoomAvailable={isZoomAvailable}
              isGoogleMeetAvailable={isGoogleMeetAvailable}
              zoomMeet={zoomMeet}
              googleMeet={googleMeet}
              setParentZoomMeet={setZoomMeet}
              setParentGoogleMeet={setGoogleMeet}
              zoomPrivateMeeting={zoomPrivateMeeting}
              setParentZoomPrivateMeeting={setZoomPrivateMeeting}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 4:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventAttendees
              attendees={attendees}
              setParentAttendees={setAttendees}
              userId={userId}
              client={client}
             />
             <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 5:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventVisibilityAndAlarmsStep
              alarms={alarms}
              setParentAlarms={setAlarms}
              visibility={visibility}
              setParentVisibility={setVisibility}
              userId={userId}
             />
             <Box flexDirection="row" justifyContent="space-between" alignItems="center">
               {renderPrevButton()}
               {renderNextButton()}
             </Box>
          </Box>
         )
      case 6:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventAddCategories
              categories={tags}
              setParentSelectedCategories={setSelectedCategories}
              selectedCategories={selectedCategories}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )        
      case 7: 
        return (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Box flex={1} style={{ width: '100%' }} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  minHeight="65vh" maxHeight="65vh">
              <Box p={{ phone: 'm', tablet: 'l'}}>
                <Text variant="subheaderNormal">
                  Create Event
                </Text>
              </Box>
              <Box pt={{ phone: 'm', tablet: 'l' }}>
                <Button onClick={createEventForUser}>
                  Create
                </Button>
              </Box>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '75%' }}>
              {renderPrevButton()}
              <Box />
            </Box>
          </Box>
        )
       default:
         return (
           <Box justifyContent="center" alignItems="center">
             <RegularCard>
               <Text variant="header">
                 Oops... something went wrong
               </Text>
             </RegularCard>
           </Box>
         )
     }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ height: '100%'}}>
      <Wizard
        items={[
            {
                index: 0,
                label: 'Set Base',
            },
            {
                index: 1,
                label: 'Continue Base',
            },
            {
                index: 2,
                label: 'Select Recurrence',
            },
              {
                index: 3,
                label: 'Select Virtual Meet',
            },
              {
                index: 4,
                label: 'Select Event Attendees',
            },
              {
                index: 5,
                label: 'Set Visibility And Alarms',
            },
            {
                index: 6,
                label: 'Select Categories for Event',
            },
            {
                index: 7,
                label: 'Create Event',
            },
            
        ]}

        completed={completedStep}
        activeIndex={activeIndex}
      />
      {renderCurrentStep()}
      <Box>
        <button className="btn btn-link no-underline hover:no-underline" onClick={closeCreateEvent}>
            Close
        </button>
      </Box>
    </Box>
  )

}

export default UserCreateEvent
