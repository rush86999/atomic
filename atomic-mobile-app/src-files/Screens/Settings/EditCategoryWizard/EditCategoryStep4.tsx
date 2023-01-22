import React, {
  useState,
  Dispatch,
  SetStateAction,
    useRef,
  useEffect,
} from 'react'
import { Colors, Switch, TextField, Picker, PickerValue } from 'react-native-ui-lib'
import Icon from 'react-native-vector-icons/Ionicons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultTimePreferenceType, DefaultTimePreferenceTypes, Time } from '@app/dataTypes/CategoryType'
import _ from 'lodash'
import DatePicker from 'react-native-date-picker'
import { dayjs } from '@app/date-utils'
import { getISODay, setISODay } from 'date-fns'
import Toast from 'react-native-toast-message'
import RegularCard from '@components/RegularCard'
import { FlatList, Pressable, Appearance } from 'react-native'
import { palette } from '@theme/theme'
import Button from '@components/Button'

const dark = Appearance.getColorScheme() === 'dark'

type Props = {
    defaultTimePreferences: DefaultTimePreferenceTypes,
    setParentDefaultTimePreference: Dispatch<SetStateAction<DefaultTimePreferenceTypes>>,
}

type DayOfWeekIntType = -1 | 1 | 2 | 3 | 4 | 5 | 6 | 7

type RenderPreferredTimeRangeType = {
    item: DefaultTimePreferenceType,
    index: number,
}

const dayOfWeekInt = [-1, 1, 2, 3, 4, 5, 6, 7]

function EditCategoryStep4(props: Props) {
    const [defaultTimePreferences, setDefaultTimePreferences] = useState<DefaultTimePreferenceTypes>(props?.defaultTimePreferences || [])
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekIntType>(-1)
    const [startTimeRange, setStartTimeRange] = useState<Date>(new Date())
    const [endTimeRange, setEndTimeRange] = useState<Date>(dayjs().add(30, 'm').toDate())
    const [isStartTimeRange, setIsStartTimeRange] = useState<boolean>(false)
    const [isEndTimeRange, setIsEndTimeRange] = useState<boolean>(false)

    const flatlistRef = useRef<FlatList>()


    const setParentDefaultTimePreference = props?.setParentDefaultTimePreference

    const changeDefaultTimePreference = (value: DefaultTimePreferenceTypes) => {
        setDefaultTimePreferences(value)
        setParentDefaultTimePreference(value)
    }

     const hideStartTimeRangePicker = () => setIsStartTimeRange(false)
    
    const showStartTimeRangePicker = () => setIsStartTimeRange(true)

    const hideEndTimeRangePicker = () => setIsEndTimeRange(false)

    const showEndTimeRangePicker = () => setIsEndTimeRange(true)

    const changeDayOfWeek = (item: PickerValue) => {
        setDayOfWeek(item as DayOfWeekIntType)
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

            if (timeRangeDuration < 30) {
                Toast.show({
                    text1: 'End time must be same or longer than 30 minutes',
                    text2: 'Please select a end time that is same or longer than 30 minutes',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            const startTime = dayjs(startTimeRange).format('HH:mm') as Time
            const endTime = dayjs(endTimeRange).format('HH:mm') as Time

            const newPreferredTimeRange: DefaultTimePreferenceType = {
                dayOfWeek,
                startTime,
                endTime,
            }

            const newDefaultTimePreference = (defaultTimePreferences || []).concat([newPreferredTimeRange])
            changeDefaultTimePreference(newDefaultTimePreference)

            setStartTimeRange(new Date())
            setEndTimeRange(dayjs().add(30, 'm').toDate())
            setDayOfWeek(-1)

        } catch (e) {
            
        }
    }

    const removeItem = async (index: number) => {
        try {
            if (!defaultTimePreferences[index]) {
                Toast.show({
                    text1: 'Item is required',
                    text2: 'Please select an item',
                    type: 'error',
                    position: 'top',
                })
                return
            }

            const newdefaultTimePreference = defaultTimePreferences.filter((item, i) => i !== index)   
            changeDefaultTimePreference(newdefaultTimePreference)
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

    const timePreferenceAvailable = defaultTimePreferences?.length > 0
    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                    Preferred Times
                </Text>
            </Box>
            <Box flex={5} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <FlatList
                    style={{ flex: 1 }}
                    data={timePreferenceAvailable ? _.reverse(_.cloneDeep(defaultTimePreferences)) : null}
                    keyExtractor={item => `${item.startTime}-${item.endTime}-${item.dayOfWeek}`}
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
                            if (timeRangeDuration < 30) {
                                setEndTimeRange(dayjs(date).add(30, 'm').toDate())
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
                        style={{ color: dark ? palette.white : palette.textBlack}}
                        placeholder="Pick a day of the week"
                        useNativePicker
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
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Pressable onPress={addItem}>
                    <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                        <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
                        <Text variant="buttonLink">
                            Add
                        </Text>
                    </Box>
                </Pressable>
            </Box>
        </Box>
    )

}

export default EditCategoryStep4



