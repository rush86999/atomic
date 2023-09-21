import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
   } from 'react'
import { ActivityIndicator, useColorScheme } from 'react-native'
import {Picker} from '@react-native-picker/picker'
// name = checkmark

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@lib/theme/theme'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import { createInitialSelectedCalendar, dropPrimaryLabelForCalendar, dropPrimaryLabelForCalendars, setPrimaryCalendar } from '@lib/OnBoard/OnBoardHelper2'
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'
import listCalendars from '@lib/apollo/gql/listCalendars'
import { useToast } from '@chakra-ui/react'

import { getGlobalPrimaryCalendarFunction } from '@lib/Schedule/ScheduleHelper'
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

type Props = {
    selectedCalendarId: string,
    setParentSelectedCalendarId: Dispatch<string>,
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserSelectPrimaryCalendar(props: Props) {
    // const [selectedCalendar, setSelectedCalendar] = useState<CalendarType>(props?.selectedCalendar)
    // const [calendars, setCalendars] = useState<CalendarType[]>([])
    const [selectedValue, setSelectedValue] = useState<string>(props?.selectedCalendarId)

    const client = props?.client
    const userId = props?.userId
    // const dark = useColorScheme() === 'dark'
    const toast = useToast()
    const { loading, error, data, refetch } = useQuery<{ Calendar: CalendarType[]}>(listCalendars, {
        variables: { userId: props?.userId },
    })

    if (error) {
        toast({
            status: 'error',
            title: 'Error loading calendars',
            description: error.toString(),
            duration: 9000,
            isClosable: true,
        })
    }

    const calendars = data?.Calendar
    console.log(calendars, ' calendars')
    console.log(props?.selectedCalendarId,' props?.selectedCalendarId')

    // getglobal primary calendar if any
    useEffect(() => {
        (async () => {
            const result = await getGlobalPrimaryCalendarFunction(client, props?.userId)
            if (result?.id) setSelectedValue(result?.id)

            toast({
                status: 'info',
                title: 'See a change success message',
                description: 'You should see a success changed primary calendar message. Move the picker until you do even with a single calendar.',
                duration: 9000,
                isClosable: true,
            })
        })()
    }, [client, props?.userId, toast])


    const changeSelectedCalendar = async (value: string) => {
        try {
            const newSelectedCalendar = calendars.find(i => i.id === value)
            props?.setParentSelectedCalendarId(newSelectedCalendar?.id)
            setSelectedValue(newSelectedCalendar?.id)
            // setSelectedCalendar(newSelectedCalendar as CalendarType)
            await saveSelectedCalendar(newSelectedCalendar)
        } catch (e) {
            console.log(e, ' unable to set calendar')
        }
        await refetch()
    }

    const saveSelectedCalendar = async (newSelectedCalendar: CalendarType) => {
        try {
            await setPrimaryCalendar(client, newSelectedCalendar)
            // remove primary from other calendars
            const calendarsToDropPrimary = calendars.filter(i => i.id !== newSelectedCalendar.id).map(c => c.id)
            await dropPrimaryLabelForCalendars(client, calendarsToDropPrimary)

            toast({
                status: 'success',
                title: 'Primary changed',
                description: 'You have successfully changed your primary calendar',
                duration: 9000,
                isClosable: true,
            })
        } catch (e) {
            console.log(e, ' unable to save calendar')
        }
    }

    if (loading) {
        return (
            <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} minHeight="80vh">
              <ActivityIndicator size="large" color={palette.white} />
            </Box>
        )
    }

    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Text pt={{ phone: 'm', tablet: 's' }} variant="subheader">
                Select your primary calendar
            </Text>
            <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                {`Current primary: ${selectedValue}`}
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start" style={{ minHeight: '70vh'}}>
                <Box flex={1} justifyContent="center" alignItems="center">
                    
                    <Text variant="body">
                        New events will be created on this calendar
                    </Text>
                </Box>
                <Box flex={2} mb={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                    <Box mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                        <Picker
                            style={{ width: '100%', height: '100%', color: palette.textBlack }}
                            selectedValue={selectedValue}
                            onValueChange={changeSelectedCalendar}>
                            {calendars.map(i => (
                                <Picker.Item color={palette.textBlack} label={i?.title} value={i?.id} key={i?.id} />
                            ))}
                        </Picker>
                    </Box>
                </Box>
            </div>
        </Box>
    )
}

export default UserSelectPrimaryCalendar

