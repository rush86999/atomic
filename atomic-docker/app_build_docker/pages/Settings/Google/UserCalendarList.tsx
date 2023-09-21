import React, { useState, useEffect, SetStateAction, Dispatch } from 'react'
import {
    ActivityIndicator,
  FlatList,
  useColorScheme,
} from 'react-native'
import { useQuery } from '@apollo/client'
import Switch1 from '@components/Switch'

import { useToast } from '@chakra-ui/react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { palette } from '@lib/theme/theme'

import { CalendarIntegrationType } from '@lib/dataTypes/Calendar_IntegrationType'
import { CalendarType } from '@lib/dataTypes/CalendarType'

import {
  triggerGoogleCalendarSync,
  listGoogleCalendars,
  deleteEventTriggerByResourceId,
} from '@lib/Settings/calendar_integrationHelper'
 
import {
   googleCalendarName,
   googleResourceName,
} from '@lib/calendarLib/constants'


import { CalendarListItemResponseType } from '@lib/calendarLib/types'
import { enabledCalendarType } from '@lib/Settings/types'
import { deleteEventsByCalendarId, deleteGoogleCalendarInDb, upsertGoogleCalendarInDb } from '@lib/calendarLib/calendarDbHelper'
import getCalendarWithResource from '@lib/apollo/gql/getCalendarWithResource'
import getCalendarIntegrationByResourceAndName from '@lib/apollo/gql/getCalendarIntegrationByResourceAndName'
import { listEventsForCalendar } from '@lib/OnBoard/OnBoardHelper2'
import { deleteAttendeesForEvents } from '@lib/Calendar/Attendee/AttendeeHelper'
import { deleteRemindersForEvents } from '@lib/Calendar/Reminder/ReminderHelper'
import { deleteConferencesWithIds } from '@lib/Calendar/Conference/ConferenceHelper'
import { useRouter } from 'next/router'
import { useAppContext } from '@lib/user-context'
import Button from '@components/Button'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
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

type CheckBoxPropsType = {
  updateEnabledValue: (index: number, value: boolean, id: string) => Promise<any>,
  index: number,
  enabled: boolean,
  name: string,
//   dark: boolean,
    id: string,
  calendars: CalendarType[],
}

type RenderItemType = {
  item: enabledCalendarType,
  index: number,
}
function CalendarCheckBox(props: CheckBoxPropsType) {
  const {
    enabled: oldEnabled,
    updateEnabledValue,
    index,
    name,

    id,
    calendars,
  } = props
  const [enabled, setEnabled] = useState<boolean>(oldEnabled)

  useEffect(() => {
        (async () => {
            try {

                const index = calendars.findIndex(i => (i?.id === id))
                if (index !== -1) {
                    setEnabled(true)
                }
            } catch (e) {
                console.log(e, ' error in calendar checkbox')
            }
        })()
    }, [calendars, calendars?.length, id])

  const updateEnabled = (value: boolean) => {
    setEnabled(value)
    updateEnabledValue(index, value, id)
  }

  return (
     <div className="flex justify-between items-center sm:w-1/3 w-9/12">
        <Box>
          <Text variant="optionHeader" style={{ color: palette.darkGray }}>
            {name}
          </Text>
        </Box>
        <Box>
          <Switch1
            onValueChange={updateEnabled}
            checked={enabled}
          />
        </Box>
  
      </div>
  )
}

type Props = {
    setIsGoogleCalendarList: Dispatch<SetStateAction<boolean>>
    token: string,
}
function UserGoogleCalendarList(props: Props) {
    const router = useRouter()
    const { sub, client } = useAppContext()
   

    const [calendarList, setCalendarList] = useState<CalendarListItemResponseType[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    // const [integration, setIntegration] = useState<CalendarIntegrationType>()
    // const [calendars, setCalendars] = useState<CalendarType[]>([])
    const [enabledCalendars, setEnabledCalendars] = useState<enabledCalendarType[]>([])
    const [enableAllCalendars, setEnableAllCalendars] = useState<boolean>(false)
    const [disableLoading, setDisableLoading] = useState<boolean>(false)
    
    const toast = useToast()
    const token = props?.token

    console.log(token, ' token inside UserViewGoogleCalendarList')

    const { loading: existingCalendarLoading, error: existingCalendarError, data } = useQuery<{ Calendar: CalendarType[] }>(getCalendarWithResource, {
        variables: { userId: sub, resource: googleResourceName },
    })

    const { loading: integrationLoading, error: integrationError, data: integrationData } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(getCalendarIntegrationByResourceAndName, {
        variables: {
            name: googleCalendarName,
            resource: googleResourceName,
            userId: sub,
        }
    })

    const calendars = data?.Calendar
    const calendarIntegrations = integrationData?.Calendar_Integration

    // set enabledCalendars
    useEffect(() => {
        if (!token) return
        (async () => {
            try {
                setLoading(true)
                const results = await listGoogleCalendars(token)
                console.log(results, ' results from listGoogleCalendars')
                const existingEnabledCalendars = results.map(calendar => {
                    const calendarId = calendar.id
                    const calendarName = calendar.summary
                    const calendarIndex = calendars?.findIndex(c => c.id === calendarId)
                    return {
                        id: calendarId,
                        name: calendarName,
                        enabled: (calendarIndex > -1),
                    }
                })
                setCalendarList(results)
                setEnabledCalendars(existingEnabledCalendars)
                setLoading(false)
                setDisableLoading(true)
            } catch (e) {
                console.log(e, ' error getting calendars')
                setLoading(false)
                toast({
                    status: 'error',
                    title: 'Error getting calendars',
                    description: e.toString(),
                    duration: 9000,
                    isClosable: true,
                })
                setDisableLoading(true)
            }
        })()
    }, [token, calendars?.length, calendars, toast])

    // const dark = useColorScheme() === 'dark'
    const updateEnabledCalendarValue = async (index: number, value: boolean) => {
        try {
            const newEnabledCalendars = enabledCalendars.map((c, idx) => {
                if (idx === index) {
                    return {
                        ...c,
                        enabled: value,
                    }
                }
                return c
            })
            setEnabledCalendars(newEnabledCalendars)
        } catch (e) {
            console.log(e, ' error updating enabled value')
            toast({
                status: 'error',
                title: 'Error updating enabled value',
                description: e.toString(),
                duration: 9000,
                isClosable: true,
            })
        }
    }
    const upsertCalendarInDb = async (index: number) => {
        try {
            console.log(calendarList?.[index], sub, ' calendarList?.[index], sub inside  upsertCalendarInDb')
            return upsertGoogleCalendarInDb(
                client,
                calendarList?.[index],
                sub,
            )
        } catch (e) {
            console.log(e, ' error creating calendar')
        }
    }
    const deleteCalendarInDb = async (index: number) => {
        try {
            await deleteGoogleCalendarInDb(client, calendarList?.[index]?.id)
        } catch (e) {
            console.log(e, ' error deleting calendar')
        }
    }

    // delete event trigger in db
    const deleteEventTriggerInDb = async (index: number) => {
        try {
            await deleteEventTriggerByResourceId(calendarList?.[index]?.id)
        } catch (e) {
            console.log(e, ' error deleting event trigger')
        }
    }
    
    const triggerCalendarSync = async (
        index: number,
    ) => {
        try {
            return triggerGoogleCalendarSync(calendarIntegrations?.[0]?.id, calendarList?.[index]?.id, sub)
        } catch (e) {
            console.log(e, ' error triggering calendar sync')
        }
    }

    const addCalendarToSync = async (index: number) => {
        try {
            updateEnabledCalendarValue(index, true)
            await Promise.all([
                upsertCalendarInDb(index),
                triggerCalendarSync(index),
            ])

             toast({
                status: 'success',
                title: 'Pick a Primary Calendar',
                description: 'Make sure to pick a primary calendar under settings or Atomic will not work properly ',
                duration: 9000,
                isClosable: true,
            })
        } catch (e) {
            console.log(e, ' error adding calendar to sync')
        }
    }

    const removeCalendarFromSync = async (index: number) => {
        try {
            updateEnabledCalendarValue(index, false)

            const eventsToDelete = await listEventsForCalendar(client, calendarList?.[index]?.id)
            await deleteAttendeesForEvents(client, eventsToDelete.map(e => e.id))
            const conferenceIds = eventsToDelete.map(e => e.conferenceId)
                .filter(id => !!id)

            await deleteRemindersForEvents(client, eventsToDelete.map(e => e.id), sub)
            await Promise.all([
                deleteEventTriggerInDb(index),
                deleteEventsByCalendarId(client, calendarList?.[index]?.id),
            ])

            if (conferenceIds?.length > 0) {
                await deleteConferencesWithIds(client, conferenceIds)
            }

            await deleteCalendarInDb(index)
            // await deleteCalendarWebhook(client, calendarList?.[index]?.id)
        } catch (e) {
            console.log(e, ' error removing calendar from sync')
        }
    }

    const addAllCalendarToSync = async () => {
        try {
            const promises = []
            for (let i = 0; i < calendarList?.length; i++) {
                promises.push(addCalendarToSync(i))
            }
            await Promise.all(promises)
        } catch (e) {
            console.log(e, ' error adding calendar to sync all')
        }
    }

    const removeAllCalendarFromSync = async () => {
        try {
            const promises = []
            for (let i = 0; i < calendarList?.length; i++) {
                promises.push(removeCalendarFromSync(i))
            }
            await Promise.all(promises)
        } catch (e) {
            console.log(e, ' error removing calendar from sync all')
        }
    }

    const updateEnabledValue = async (index: number, value: boolean) => {
        try {
            
            const newEnabledCalendars = enabledCalendars
                .slice(0, index)
                .concat([{ ...(enabledCalendars?.[index]), enabled: value }])
                .concat(enabledCalendars.slice(index + 1))

            setEnabledCalendars(newEnabledCalendars)
            
            if (value) {
                return addCalendarToSync(index)
            } else {
                return removeCalendarFromSync(index)
            }
        } catch (e) {
            console.log(e, ' error updating enabled value')
            toast({
                status: 'error',
                title: 'Error updating enabled value',
                description: e.toString(),
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const updateAllCalendars = async (value: boolean) => {
        try {
            if (value) {
                setEnableAllCalendars(true)
                return addAllCalendarToSync()
            }
            setEnableAllCalendars(false)
            return removeAllCalendarFromSync()
        } catch (e) {
            console.log(e, ' error updating all calendars')
            toast({
                status: 'error',
                title: 'Error updating all calendars',
                description: e.toString(),
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const navigateToSelectPrimaryCalendar = () => router.push('/Settings/UserSelectPrimaryCalendarForSettings')

    const renderItem = (item: enabledCalendarType, index: number) => {
        return (
            <CalendarCheckBox
                updateEnabledValue={updateEnabledValue}
                index={index}
                enabled={item?.enabled}
                name={item?.name}
                id={item?.id}
                calendars={calendars}
                key={item?.id}
            />
        )
    }

    if (loading || existingCalendarLoading || integrationLoading || !disableLoading) {
        return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%'}} minHeight="70vh">
            <ActivityIndicator size="large" color={palette.white} />
        </Box>
        )
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center" style={{ minHeight: '70vh'}}>
            <Box flexDirection="row" justifyContent="space-around" alignItems="center" >
                <Box>
                    <Text variant="optionHeader" style={{ color: palette.darkGray }}>
                    All Google Calendars
                    </Text>
                </Box>
                <Box>
                    <Switch1
                        onValueChange={updateAllCalendars}
                        checked={enableAllCalendars}
                    />
                </Box>
            </Box>
            <Box justifyContent="center" alignItems="center" width="100%">
            {enabledCalendars?.map((item, index) => renderItem(item, index))}
            </Box>
            <div className="flex justify-center items-center mt-3">
                <Button onClick={navigateToSelectPrimaryCalendar}>
                    Select Primary Calendar
                </Button>
            </div>
            <div className="flex justify-center items-center mt-3">
                <Button onClick={() => props?.setIsGoogleCalendarList(false)}>
                    Close
                </Button>
            </div>
        </div>
    )
}

export default UserGoogleCalendarList
