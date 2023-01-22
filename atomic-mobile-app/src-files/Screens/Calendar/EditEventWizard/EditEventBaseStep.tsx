import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from 'react'
import { Appearance, Pressable } from 'react-native'
import DatePicker from 'react-native-date-picker'
import { dayjs, RNLocalize } from '@app/date-utils'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { Colors, Switch, TextArea, TextField } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

// dayjs.extend(localizedFormat)

type Props = {
  title: string,
  notes: string,
  location: string,
  startDate: Date,
  endDate: Date,
  setParentTitle: Dispatch<SetStateAction<string>>,
  setParentNotes: Dispatch<SetStateAction<string>>,
  setParentLocation: Dispatch<SetStateAction<string>>,
  setParentStartDate: Dispatch<SetStateAction<Date>>,
  setParentEndDate: Dispatch<SetStateAction<Date>>,
}

const dark = Appearance.getColorScheme() === 'dark'
function EditEventBaseStep(props: Props) {
  const [title, setTitle] = useState<string>(props?.title)
  const [notes, setNotes] = useState<string>(props?.notes)
  const [location, setLocation] = useState<string>(props?.location)
  const [startDate, setStartDate] = useState<Date>(props?.startDate)
  const [endDate, setEndDate] = useState<Date>(props?.endDate)
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState<boolean>(false)
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState<boolean>(false)

  const setParentTitle = props?.setParentTitle
  const setParentNotes = props?.setParentNotes
  const setParentLocation = props?.setParentLocation
  const setParentStartDate = props?.setParentStartDate
  const setParentEndDate = props?.setParentEndDate
  
  
  
  useEffect(() => {
    if (props?.title) {
      setTitle(props?.title)
    }

    if (props?.notes) {
      setNotes(props?.notes)
    }

    if (props?.location) {
      setLocation(props?.location)
    }

    if (props?.startDate) {
      setStartDate(props?.startDate)
    }

    if (props?.endDate) {
      setEndDate(props?.endDate)
    }

  }, [props?.title, props?.notes, props?.location, props?.startDate, props?.endDate])


  const changeTitle = (value: string) => {
    setTitle(value)
    setParentTitle(value)
  }

  const changeNotes = (value: string) => {
    setNotes(value)
    setParentNotes(value)
  }

  const changeLocation = (value: string) => {
    setLocation(value)
    setParentLocation(value)
  }

  const changeStartDate = (value: Date) => {
    setStartDate(value)
    setParentStartDate(value)
  }

  const changeEndDate = (value: Date) => {
    setEndDate(value)
    setParentEndDate(value)
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

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
        <Pressable onPress={showStartDatePicker}>
          <Text variant="buttonLink">
           Start: {dayjs(startDate).format('MMMM D, h:mm A')}
          </Text>
        </Pressable>
        <DatePicker
          modal
          open={isStartDatePickerVisible}
          date={startDate}
          onConfirm={(date) => {
            const durationMinutes = dayjs.duration(dayjs(endDate).diff(dayjs(startDate))).asMinutes()
            const newEndDate = dayjs(date).add(durationMinutes, 'minutes').toDate()
            changeStartDate(date)
            changeEndDate(newEndDate)
            hideStartDatePicker()
          }}
          onCancel={() => {
            hideStartDatePicker()
          }}
          theme={dark ? 'dark' : 'light'}
        />
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
        <Pressable onPress={showEndDatePicker}>
          <Text variant="buttonLink">
            End: {dayjs(endDate).format('MMMM D, h:mm A')}
          </Text>
        </Pressable>
        <DatePicker
          modal
          open={isEndDatePickerVisible}
          date={endDate}
          onConfirm={(date) => {
            changeEndDate(date)
            hideEndDatePicker()
          }}
          onCancel={() => {
            hideEndDatePicker()
          }}
          theme={dark ? 'dark' : 'light'}
        />
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
        <Box>
          <TextField
            title="Title"
            placeholder="title"
            onChangeText={(text: string) => changeTitle(text)}
            value={title || props?.title}
            style={{ width: '100%'}}
          />
        </Box>
      </Box>
      <Box flex={3} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
        <TextField
          placeholder="notes"
          onChangeText={(text: string) => changeNotes(text)}
          value={notes || props?.notes}
          style={{ width: '100%'}}
          multiline
        />
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
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

export default EditEventBaseStep
