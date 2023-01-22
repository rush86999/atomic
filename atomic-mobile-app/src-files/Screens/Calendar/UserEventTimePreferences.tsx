import React, { useState, useEffect, useCallback } from 'react'
import { RouteProp, useFocusEffect } from '@react-navigation/native'
import { Picker, PickerValue } from 'react-native-ui-lib'
import DatePicker from 'react-native-date-picker'
import { v4 as uuid } from 'uuid'
import { getISODay, setISODay } from 'date-fns'
import Toast from 'react-native-toast-message'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import { dayjs } from '@app/date-utils'

import {
  PreferredTimeRangeType,
} from '@app/dataTypes/PreferredTimeRangeType'

import {
    listPreferredTimeRangesByEvent,
    deletePreferredTimeRangeWithId,
    insertPreferredTimeRangeOneForEvent,
} from '@screens/Calendar/UserTrainCalendarHelper'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@app/calendar/calendarDbHelper'
import { Appearance, FlatList, Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { palette } from '@theme/theme'
import { Time } from '@app/dataTypes/EventType'
import _ from 'lodash'
import { atomicUpsertEventInDb } from '@screens/Calendar/UserCreateCalendarHelper';




type RootStackEventParamList = {
    UserEventTimePreferences: {
        eventId: string,
    },
}

type UserEventTimePreferencesRouteProp = RouteProp<
  RootStackEventParamList,
  'UserEventTimePreferences'
>

type Props = {
    userId: string,
    route: UserEventTimePreferencesRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

type RenderPreferredTimeRangeType = {
    item: PreferredTimeRangeType,
    index: number,
}

const dayOfWeekInt = [-1, 1, 2, 3, 4, 5, 6, 7]

const dark = Appearance.getColorScheme() === 'dark'

function UserEventTimePreferences(props: Props) {
    const [timeRangePreferences, setTimeRangePreferences] = useState<PreferredTimeRangeType[]>(null)
    const [summary, setSummary] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [dayOfWeek, setDayOfWeek] = useState<-1 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(-1)
    const [startTimeRange, setStartTimeRange] = useState<Date>(new Date())
    const [endTimeRange, setEndTimeRange] = useState<Date>(dayjs().add(30, 'm').toDate())
    const [isStartTimeRange, setIsStartTimeRange] = useState<boolean>(false)
    const [isEndTimeRange, setIsEndTimeRange] = useState<boolean>(false)
    const [calendarId, setCalendarId] = useState<string>('')

    const userId = props?.userId
    const client = props?.client
    const eventId = props?.route?.params?.eventId

    
    

    useEffect(() => {
        (async () => {
            if (!eventId) {
                
                return
            }

            if (!client) {
                
                return
            }

            const event = await getEventWithId(client, eventId)
            setSummary(event?.summary)
            setStartDate(event?.startDate)
            setEndDate(event?.endDate)
            setCalendarId(event?.calendarId)
        })()
    }, [client, eventId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (!eventId) {
                    
                    return
                }

                if (!client) {
                    
                    return
                }

                const event = await getEventWithId(client, eventId)
                setSummary(event?.summary)
                setStartDate(event?.startDate)
                setEndDate(event?.endDate)
                setCalendarId(event?.calendarId)
            })()
     }, [client, eventId])
    )

    useEffect(() => {
        (async () => {
            try {
                if (!eventId) {
                    return
                }

                if (!client) {
                    return
                }

                const res = await listPreferredTimeRangesByEvent(client, eventId)
                if (res?.length > 0) {
                    setTimeRangePreferences(res)
                }
            } catch (e) {
                
            }
        })()
    }, [client, eventId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    if (!eventId) {
                        return
                    }

                    if (!client) {
                        return
                    }

                    const res = await listPreferredTimeRangesByEvent(client, eventId)
                    if (res?.length > 0) {
                        setTimeRangePreferences(res)
                    }
                } catch (e) {
                    
                }
            })()
        }, [client, eventId])
    )

    const hideStartTimeRangePicker = () => setIsStartTimeRange(false)
    
    const showStartTimeRangePicker = () => setIsStartTimeRange(true)

    const hideEndTimeRangePicker = () => setIsEndTimeRange(false)

    const showEndTimeRangePicker = () => setIsEndTimeRange(true)

    const changeDayOfWeek = (item: PickerValue) => {
        
        
        setDayOfWeek(item as -1 | 1 | 2 | 3 | 4 | 5 | 6 | 7)
    }

    const addItem = async () => {
        try {
            if (!startTimeRange) {
                Toast.show({
                    text1: 'Start time is required',
                    text2: 'Please select a start time',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            if (!endTimeRange) {
                Toast.show({
                    text1: 'End time is required',
                    text2: 'Please select an end time',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            if (!eventId) {
                Toast.show({
                    text1: 'Event is required',
                    text2: 'Please select an event',
                    type: 'error',
                    position: 'top',
                })
                return
            }


            if (dayOfWeek < -1 || dayOfWeek > 7) {
                Toast.show({
                    text1: 'Day of week is required',
                    text2: 'Please select a day of week',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            if (startTimeRange.getTime() >= endTimeRange.getTime()) {
                Toast.show({
                    text1: 'Start time must be before end time',
                    text2: 'Please select a start time before end time',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(startTimeRange), 'm')
            const dateDuration = dayjs(startDate.slice(0, 19)).diff(dayjs(endDate.slice(0, 19)), 'm')

            if (timeRangeDuration < dateDuration) {
                Toast.show({
                    text1: 'End time must be same or longer than event duration',
                    text2: 'Please select a end time that is same or longer than event duration',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            const startTime = dayjs(startTimeRange).format('HH:mm') as Time
            const endTime = dayjs(endTimeRange).format('HH:mm') as Time
            const id = uuid()
            const createdDate = dayjs().toISOString()
            const updatedAt = createdDate

            const newPreferredTimeRange: PreferredTimeRangeType = {
                id,
                eventId,
                dayOfWeek,
                startTime,
                endTime,
                createdDate,
                updatedAt,
                userId,
            }

            const newTimeRangePreferences = timeRangePreferences.concat([newPreferredTimeRange])
            setTimeRangePreferences(newTimeRangePreferences)

            await insertPreferredTimeRangeOneForEvent(client, id, eventId, startTime, endTime, dayOfWeek, userId, createdDate, updatedAt)
            await atomicUpsertEventInDb(
                client,
                eventId,
                eventId.split('#')[0],
                userId,
                startDate,
                endDate,
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
                calendarId,
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
                true,
            )

            setStartTimeRange(new Date())
            setEndTimeRange(new Date())
            setDayOfWeek(-1)

        } catch (e) {
            
        }
    }

    const removeItem = async (index: number) => {
        try {
            if (!timeRangePreferences[index]) {
                Toast.show({
                    text1: 'Item is required',
                    text2: 'Please select an item',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            const newTimeRangePreferences = timeRangePreferences.filter((item, i) => i !== index)   
            setTimeRangePreferences(newTimeRangePreferences)
            await deletePreferredTimeRangeWithId(client, timeRangePreferences[index].id)
        } catch (e) {
            
        }
    }


    const renderItem = ({ item, index }: RenderPreferredTimeRangeType) => (
        <Box flex={1} justifyContent="center" alignItems="center">
            <RegularCard>
                <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                    {(((item?.dayOfWeek === -1) || (item?.dayOfWeek === null))) ? 'Any day of week' : dayjs(setISODay(dayjs().toDate(), item.dayOfWeek)).format('dddd')}
                </Text>
                <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                    {dayjs(item.startTime, 'HH:mm').format('h:mm A')}
                    {' - '}
                    {dayjs(item.endTime, 'HH:mm').format('h:mm A')}
                </Text>
                <Pressable onPress={() => removeItem(index)}>
                    <Text m={{ phone: 's', tablet: 'm' }} variant="buttonLink">
                        <Icon color={dark ? palette.white : palette.purplePrimary} name="ios-remove-circle-outline" size={20} />
                        {' '}
                        Remove
                    </Text>
                </Pressable>
            </RegularCard>
        </Box>
    )

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Text variant="optionHeader">
                    {summary}
                </Text>
            </Box>
            <Box flex={3} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <FlatList
                    style={{ flex: 1 }}
                    data={timeRangePreferences?.length > 0 ? _.reverse(_.cloneDeep(timeRangePreferences)) : null}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                />
            </Box>
            <Box flex={3} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Pressable onPress={showStartTimeRangePicker}>
                        <Text variant="buttonLink">Start Time: {dayjs(startTimeRange).format('h:mm A')}</Text>
                    </Pressable>
                    <DatePicker
                        modal
                        open={isStartTimeRange}
                        date={startTimeRange}
                        onConfirm={(date) => {
                            setStartTimeRange(date)
                            const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(date), 'm')
                            const dateDuration = dayjs(endDate.slice(0, 19)).diff(dayjs(startDate.slice(0, 19)), 'm')
                            if (timeRangeDuration < dateDuration) {
                                setEndTimeRange(dayjs(date).add(dateDuration, 'm').toDate())
                            }

                            hideStartTimeRangePicker()
                        }}
                        mode="time"
                        onCancel={() => {
                            hideStartTimeRangePicker()
                        }}
                        theme={dark ? 'dark' : 'light'}
                    />
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Pressable onPress={showEndTimeRangePicker}>
                        <Text variant="buttonLink">End Time: {dayjs(endTimeRange).format('h:mm A')}</Text>
                    </Pressable>
                    <DatePicker
                        modal
                        open={isEndTimeRange}
                        date={endTimeRange}
                        onConfirm={(date) => {
                            setEndTimeRange(date)
                            hideEndTimeRangePicker()
                        }}
                        mode="time"
                        onCancel={() => {
                            hideEndTimeRangePicker()
                        }}
                        theme={dark ? 'dark' : 'light'}
                    />
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Picker
                        modal
                        placeholder="Pick a day of the week"
                        useNativePicker
                        style={{ color: dark ? palette.white : palette.textBlack }}
                        value={dayOfWeek}
                        onChange={changeDayOfWeek}
                        migrateTextField
                    >
                        {_.map(dayOfWeekInt, option => (
                        <Picker.Item
                            key={option}
                            value={option}
                            label={(option !== -1 ? dayjs(setISODay(dayjs().toDate(), option)).format('dddd') : 'Any day of the week')}
                        />
                        ))}
                    </Picker>
                </Box>
                <Button onPress={addItem}>
                    Add
                </Button>
            </Box>
        </Box>
    )


}

export default UserEventTimePreferences







