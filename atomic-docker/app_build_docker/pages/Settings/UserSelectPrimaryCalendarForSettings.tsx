import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
   } from 'react'
import { ActivityIndicator, useColorScheme } from 'react-native'
import {Picker} from '@react-native-picker/picker'
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'


import { palette } from '@lib/theme/theme'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import { createInitialSelectedCalendar, dropPrimaryLabelForCalendar, dropPrimaryLabelForCalendars, setPrimaryCalendar } from '@lib/OnBoard/OnBoardHelper2'
import { useToast } from '@chakra-ui/react'

import listCalendars from '@lib/apollo/gql/listCalendars'
import { getGlobalPrimaryCalendarFunction } from '@lib/Schedule/ScheduleHelper'
import { useRouter } from 'next/router'

import { useAppContext } from '@lib/user-context'
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


function UserSelectPrimaryCalendarForSettings() {
    const [selectedValue, setSelectedValue] = useState<string>()
    const { sub, client } = useAppContext()
    
    const userId = sub
    // const dark = useColorScheme() === 'dark'
    const toast = useToast()
    const { loading, error, data, refetch } = useQuery<{ Calendar: CalendarType[]}>(listCalendars, {
        variables: { userId: sub },
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
    
    useEffect(() => {
        (async () => {
            const result = await getGlobalPrimaryCalendarFunction(client, userId)
            if (result?.id) setSelectedValue(result?.id)

            toast({
                status: 'info',
                title: 'See a change success message',
                description: 'You should see a success changed primary calendar message. Move the picker until you do even with a single calendar.',
                duration: 9000,
                isClosable: true,
            })
        })()
    }, [client, userId, toast])

    
    useEffect(() => {
        (async () => {
            await createInitialSelectedCalendar(client, userId, setSelectedValue)
        })()
    }, [client, userId])


    const changeSelectedCalendar = async (value: string) => {
        try {
            const newSelectedCalendar = calendars.find(i => i.id === value)
            setSelectedValue(newSelectedCalendar?.id)
            await saveSelectedCalendar(newSelectedCalendar)
            toast({
                status: 'success',
                title: 'Primary Changed',
                description: `Primary calendar changed to ${newSelectedCalendar?.id}`,
                duration: 9000,
                isClosable: true,
            })
        } catch (e) {
            console.log(e, ' unable to set calendar')
        }

        await refetch()
    }

    const saveSelectedCalendar = async (newSelectedCalendar: CalendarType) => {
        try {
            await setPrimaryCalendar(client, newSelectedCalendar)
            const calendarsToDropPrimary = calendars.filter(i => i.id !== newSelectedCalendar.id).map(i => i.id)
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
        <Box justifyContent="space-around" alignItems="center" style={{ width: '100%', minHeight: '70vh' }}>
            <Text pt={{ phone: 'm', tablet: 's' }} variant="subheader">
                Select your primary calendar
            </Text>
            <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                {`Current primary: ${selectedValue}`}
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start">
                <Box justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                    
                    <Text variant="caption">
                        New events will be created on this calendar
                    </Text>
                </Box>
                <Box mb={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '90%' }}>
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

export default UserSelectPrimaryCalendarForSettings

