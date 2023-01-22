import React, {
    useState,
    useEffect,
   } from 'react'
import { useColorScheme } from 'react-native'
import {Picker} from '@react-native-picker/picker'
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'

import Box from '@components/common/Box'
import Text from '@components/common/Text'


import { palette } from '@theme/theme'
import { CalendarType } from '@app/dataTypes/CalendarType'
import { createInitialSelectedCalendar, dropPrimaryLabelForCalendars, setPrimaryCalendar } from '@screens/OnBoard/OnBoardHelper'
import Toast from 'react-native-toast-message'
import Spinner from 'react-native-spinkit'
import listCalendars from '@app/apollo/gql/listCalendars'
import { getGlobalPrimaryCalendarFunction } from '@screens/Schedule/ScheduleHelper'



type Props = {
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserSelectPrimaryCalendarForSettings(props: Props) {
    const [selectedValue, setSelectedValue] = useState<string>()

    const client = props?.client
    const userId = props?.userId
    const dark = useColorScheme() === 'dark'

    const { loading, error, data, refetch } = useQuery<{ Calendar: CalendarType[]}>(listCalendars, {
        variables: { userId: props?.userId },
    })

    if (error) {
        Toast.show({
            type: 'error',
            text1: 'Error loading calendars',
            text2: error.toString(),
        })
    }

    const calendars = data?.Calendar
    
    useEffect(() => {
        (async () => {
            const result = await getGlobalPrimaryCalendarFunction(client, userId)
            if (result?.id) setSelectedValue(result?.id)

            Toast.show({
                type: 'info',
                text1: 'See a change success message',
                text2: 'You should see a success changed primary calendar message. Move the picker until you do even with a single calendar.',
            })
        })()
    }, [])

    
    useEffect(() => {
        (async () => {
            await createInitialSelectedCalendar(client, userId, setSelectedValue)
        })()
    }, [])


    const changeSelectedCalendar = async (value: string) => {
        try {
            const newSelectedCalendar = calendars.find(i => i.id === value)
            setSelectedValue(newSelectedCalendar?.id)
            await saveSelectedCalendar(newSelectedCalendar)
        } catch (e) {
            
        }

        await refetch()
    }

    const saveSelectedCalendar = async (newSelectedCalendar: CalendarType) => {
        try {
            await setPrimaryCalendar(client, newSelectedCalendar)
            const calendarsToDropPrimary = calendars.filter(i => i.id !== newSelectedCalendar.id).map(i => i.id)
            await dropPrimaryLabelForCalendars(client, calendarsToDropPrimary)

            Toast.show({
                type: 'success',
                text1: 'Primary changed',
                text2: 'You have successfully changed your primary calendar',
            })
        } catch (e) {
            
        }
    }

    if (loading) {
        return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
        </Box>
        )
    }

    return (
        <Box flex={1} justifyContent="space-around" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Text m={{ phone: 's', tablet: 'm' }} variant="subheaderNormal">
                    Select your primary calendar
                </Text>
                <Text variant="caption">
                    New events will be created on this calendar
                </Text>
            </Box>
            <Box flex={3} mb={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '90%' }}>
                <Box mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Picker
                        style={{ width: '100%', height: '100%', color: dark ? palette.white : palette.textBlack }}
                        selectedValue={selectedValue}
                        onValueChange={changeSelectedCalendar}>
                        {calendars.map(i => (
                            <Picker.Item color={dark ? palette.white : palette.textBlack} label={i?.title} value={i?.id} key={i?.id} />
                        ))}
                    </Picker>
                </Box>
            </Box>
        </Box>
    )
}

export default UserSelectPrimaryCalendarForSettings

