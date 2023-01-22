import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import { dayjs } from '@app/date-utils'
import DatePicker from 'react-native-date-picker'
import { TextField, Switch, Colors, Hint } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { Appearance, Pressable, ScrollView, StyleSheet } from 'react-native'
import Toast from 'react-native-toast-message'
import { palette } from '@theme/theme'

type Props = {
  cancelIfAnyRefuse: boolean,
  enableAttendeePreferences: boolean,
  attendeeCanModify: boolean,
  expireDate: Date,
  duration: number,
  setParentCancelIfAnyRefuse: Dispatch<SetStateAction<boolean>>,
  setParentEnableAttendeePreferences: Dispatch<SetStateAction<boolean>>,
  setParentAttendeeCanModify: Dispatch<SetStateAction<boolean>>,
  setParentExpireDate: Dispatch<SetStateAction<Date>>,
  setParentDuration: Dispatch<SetStateAction<number>>,
}

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  duration: {
      fontSize: 16,
      lineHeight: 24,
      color: dark ? palette.white : '#221D23',
      width: '30%',
  }
})


function EditMeetingAssistBaseStep5(props: Props) {
  const [cancelIfAnyRefuse, setCancelIfAnyRefuse] = useState<boolean>(props?.cancelIfAnyRefuse)
  const [enableAttendeePreferences, setEnableAttendeePreferences] = useState<boolean>(props?.enableAttendeePreferences)
  const [attendeeCanModify, setAttendeeCanModify] = useState<boolean>(props?.attendeeCanModify)
  const [expireDate, setExpireDate] = useState<Date>(props?.expireDate)
  const [duration, setDuration] = useState<number>(props?.duration)
  const [isMessage, setIsMessage] = useState<boolean>(false)
  const [isExpireDatePicker, setIsExpireDatePicker] = useState<boolean>(false)


  const setParentCancelIfAnyRefuse = props?.setParentCancelIfAnyRefuse
  const setParentEnableAttendeePreferences = props?.setParentEnableAttendeePreferences
  const setParentAttendeeCanModify = props?.setParentAttendeeCanModify
  const setParentExpireDate = props?.setParentExpireDate
  const setParentDuration = props?.setParentDuration

  const changeCancelIfAnyRefuse = (value: boolean) => {
    setCancelIfAnyRefuse(value)
    setParentCancelIfAnyRefuse(value)
  }

  const changeEnableAttendeePreferences = (value: boolean) => {
      setEnableAttendeePreferences(value)
      setParentEnableAttendeePreferences(value)
  }

  const changeAttendeeCanModify = (value: boolean) => {
      setAttendeeCanModify(value)
      setParentAttendeeCanModify(value)
  }

  const changeExpireDate = (value: Date) => {
      setExpireDate(value)
      setParentExpireDate(value)
  }

  // 
  const changeDuration = (value: string) => {
      const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)

      // validate
      if (intValue < 10) {
          Toast.show({
              type: 'error',
              text1: 'Too short',
              text2: 'Your duration is too short'
          })

          return
      }

      setDuration(intValue)
      setParentDuration(intValue)
  }

  const hideExpireDatePicker = () => setIsExpireDatePicker(false)

  const showExpireDatePicker = () => setIsExpireDatePicker(true)

    return (
      <ScrollView>
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Cancel planning if any refuse?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={cancelIfAnyRefuse}
                        onValueChange={changeCancelIfAnyRefuse}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Allow attendee to select time preferences (slots) for event?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={enableAttendeePreferences}
                        onValueChange={changeEnableAttendeePreferences}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Allow attendee to change existing time preferences (slots) for event?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={attendeeCanModify}
                        onValueChange={changeAttendeeCanModify}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>   
                    <Hint visible={isMessage} message={"You can select a time when the meeting assist will no longer valid if minimum number of attendees do not say \'Yes\'. In other words, no new events will be created."} color={Colors.purple} onBackgroundPress={() => setIsMessage(false)}>
                        <Pressable onPress={() => setIsMessage(!isMessage)}>
                            <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                                When will planning this event expire if minimum threshold of accepted invites is not met?
                            </Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" alignItems="center" style={{ width: '100%' }}>
                    <Pressable onPress={showExpireDatePicker}>
                        <Text variant="buttonLink">{dayjs(expireDate).format('dddd, MMMM D, h:mm A')}</Text>
                    </Pressable>
                    <DatePicker
                        modal
                        open={isExpireDatePicker}
                        date={expireDate}
                        onConfirm={(date) => {
                            changeExpireDate(date)
                            hideExpireDatePicker()
                        }}
                        onCancel={() => {
                            hideExpireDatePicker()
                        }}
                        theme={dark ? 'dark' : 'light'}
                    />
                </Box>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        How long is the event?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" alignItems="center" style={{ width: '100%' }}>
                    <TextField
                        title="Duration (minutes)"
                        type="numeric"
                        onChangeText={changeDuration}
                        value={`${duration}`}
                        placeholder="1"
                        style={styles.duration}
                    />
                </Box>
            </Box>
        </Box>
    </ScrollView>
  )
}

export default EditMeetingAssistBaseStep5
