
import { dayjs } from '@app/date-utils'
import DatePicker from 'react-native-date-picker'
import { Colors, Switch, TextField } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { Appearance, Pressable } from 'react-native'
import { palette } from '@theme/theme'
import _ from 'lodash'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'



const dark = Appearance.getColorScheme() === 'dark'

type Props = {
    notes: string,
    windowStartDate: Date,
    windowEndDate: Date,
    location: string,
    cancel: boolean,
    summary: string,
    setParentNotes: Dispatch<SetStateAction<string>>,
    setParentSummary: Dispatch<SetStateAction<string>>,
    setParentWindowStartDate: Dispatch<SetStateAction<Date>>,
    setParentWindowEndDate: Dispatch<SetStateAction<Date>>,
    setParentLocation: Dispatch<SetStateAction<string>>,
    setParentCancel: Dispatch<SetStateAction<boolean>>,
}

function EditMeetingAssistBaseStep(props: Props) {
    const [notes, setNotes] = useState<string>(props?.notes)
    const [summary, setSummary] = useState<string>(props?.summary)
    const [windowStartDate, setWindowStartDate] = useState<Date>(props?.windowStartDate)
    const [windowEndDate, setWindowEndDate] = useState<Date>(props?.windowEndDate)
    const [location, setLocation] = useState<string>(props?.location)
    const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState<boolean>(false)
    const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState<boolean>(false)
    const [cancel, setCancel] = useState<boolean>(props?.cancel)

    useEffect(() => {
        if (windowStartDate !== props?.windowStartDate) {
            setWindowStartDate(props?.windowStartDate)
        }
    }, [props?.windowStartDate])

    useEffect(() => {
        if (windowEndDate !== props?.windowEndDate) {
            setWindowEndDate(props?.windowEndDate)
        }
    }, [props?.windowEndDate])

    const setParentNotes = props?.setParentNotes
    const setParentSummary = props?.setParentSummary
    const setParentWindowStartDate = props?.setParentWindowStartDate
    const setParentWindowEndDate = props?.setParentWindowEndDate
    const setParentLocation = props?.setParentLocation
    const setParentCancel = props?.setParentCancel


    const changeNotes = (value: string) => {
        setNotes(value)
        setParentNotes(value)
    }

    const changeSummary = (value: string) => {
        setSummary(value)
        setParentSummary(value)
    }

    const changeWindowStartDate = (value: Date) => {
        setWindowStartDate(value)
        setParentWindowStartDate(value)
    }

    const changeWindowEndDate = (value: Date) => {
        setWindowEndDate(value)
        setParentWindowEndDate(value)
    }

    const changeLocation = (value: string) => {
        setLocation(value)
        setParentLocation(value)
    }

    const showStartDatePicker = () => {
        setIsStartDatePickerVisible(true)
    }

    const hideStartDatePicker = () => {
        setIsStartDatePickerVisible(false)
    }

    const showEndDatePicker = () => {
        setIsEndDatePickerVisible(true)
    }

    const hideEndDatePicker = () => {
        setIsEndDatePickerVisible(false)
    }

    const changeCancel = (value: boolean) => {
        setCancel(value)
        setParentCancel(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '80%'}}>
                <Pressable onPress={showStartDatePicker}>
                    <Text variant="buttonLink">
                        Start: {dayjs(windowStartDate).format('MMMM D, h:mm A')}
                    </Text>
                </Pressable>
                <DatePicker
                    modal
                    open={isStartDatePickerVisible}
                    date={windowStartDate}
                    onConfirm={(date) => {
                        const durationMinutes = dayjs.duration(dayjs(windowEndDate).diff(dayjs(windowStartDate))).asMinutes()
                        const newEndDate = dayjs(date).add(durationMinutes, 'minutes').toDate()
                        changeWindowStartDate(date)
                        changeWindowEndDate(newEndDate)
                        hideStartDatePicker()
                    }}
                    onCancel={() => {
                        hideStartDatePicker()
                    }}
                    theme={dark ? 'dark' : 'light'}
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '80%'}}>
                <Pressable onPress={showEndDatePicker}>
                    <Text variant="buttonLink">
                        End: {dayjs(windowEndDate).format('MMMM D, h:mm A')}
                    </Text>
                </Pressable>
                <DatePicker
                    modal
                    open={isEndDatePickerVisible}
                    date={windowEndDate}
                    onConfirm={(date) => {
                        changeWindowEndDate(date)
                        hideEndDatePicker()
                    }}
                    onCancel={() => {
                        hideEndDatePicker()
                    }}
                    theme={dark ? 'dark' : 'light'}
                />
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Do you want to cancel this meeting assist?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={cancel}
                        onValueChange={changeCancel}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
             <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%'}}>
                <Box>
                    <TextField
                        title="Title"
                        placeholder="title"
                        onChangeText={(text: string) => changeSummary(text)}
                        value={summary || props?.summary}
                        style={{ width: '100%'}}
                    />
                </Box>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%'}}>
                <TextField
                    placeholder="notes"
                    onChangeText={(text: string) => changeNotes(text)}
                    value={notes || props?.notes}
                    style={{ width: '100%'}}
                    multiline
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%'}}>
                <TextField
                    title="Location"
                    placeholder="location if any"
                    onChangeText={(text: string) => changeLocation(text)}
                    value={location || props?.location}
                    style={{ width: '100%'}}
                />
            </Box>
        </Box>
    )

}

export default EditMeetingAssistBaseStep


