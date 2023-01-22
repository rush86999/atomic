import React, {
  useState,
  Dispatch,
  SetStateAction,
 } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { RecurrenceFrequency } from 'react-native-calendar-events'
import { Colors, Dialog, Switch, TextField } from 'react-native-ui-lib'
import {Picker} from '@react-native-picker/picker'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { useColorScheme, TouchableOpacity } from 'react-native';
import DatePicker from 'react-native-date-picker'
import { palette } from '@theme/theme'
import { Day } from '@models'
import RegularCard from '@components/RegularCard'
import { dayjs } from '@app/date-utils'

const styles = StyleSheet.create({
  day: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
})

type Props = {
  recurringEndDate: Date,
  setParentRecurringEndDate: Dispatch<SetStateAction<Date>>,
  frequency: RecurrenceFrequency,
  setParentFrequency: Dispatch<SetStateAction<RecurrenceFrequency>>,
  interval: string,
  setParentInterval: Dispatch<SetStateAction<string>>,
  byWeekDay: Day[], 
  setParentWeekDay: Dispatch<SetStateAction<Day[]>>,
}

function CreateEventRecurStepAlt(props: Props) {
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(props?.recurringEndDate)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(props?.frequency)
  const [interval, setInterval1] = useState<string>()
  const [byWeekDay, setByWeekDay] = useState<Day[]>(props?.byWeekDay)
  const [MO, setMO] = useState<boolean>(props?.byWeekDay.includes(Day.MO) || false)
  const [TU, setTU] = useState<boolean>(props?.byWeekDay.includes(Day.TU) || false)
  const [WE, setWE] = useState<boolean>(props?.byWeekDay.includes(Day.WE) || false)
  const [TH, setTH] = useState<boolean>(props?.byWeekDay.includes(Day.TH) || false)
  const [FR, setFR] = useState<boolean>(props?.byWeekDay.includes(Day.FR) || false)
  const [SA, setSA] = useState<boolean>(props?.byWeekDay.includes(Day.SA) || false)
  const [SU, setSU] = useState<boolean>(props?.byWeekDay.includes(Day.SU) || false)
  const [isWeekDay, setIsWeekDay] = useState<boolean>(props?.byWeekDay?.length > 0 || false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  
  const dark = useColorScheme() === 'dark'

  const setParentRecurringEndDate = props?.setParentRecurringEndDate
  const setParentFrequency = props?.setParentFrequency
  const setParentInterval = props?.setParentInterval
  const setParentWeekDay = props?.setParentWeekDay

  const hideIsWeekDay = () => setIsWeekDay(false)
  
  const showIsWeekDay = () => setIsWeekDay(true)

  const hideRecurringEndDatePicker = () => setIsRecurring(false)
  
  const showRecurringEndDatePicker = () => setIsRecurring(true)
  
  const changeRecurringEndDate = (value: Date) => {
    setRecurringEndDate(value)
    setParentRecurringEndDate(value)
  }

  const changeFrequency = (value: RecurrenceFrequency) => {
    setFrequency(value)
    setParentFrequency(value)
  }

  const changeInterval = (value: string) => {
    setInterval1(value)
    setParentInterval(value)
  }

  const changeWeekDay = (value: Day[]) => {
    setByWeekDay(value)
    setParentWeekDay(value)
  }

  const changeMO = () => {
    setMO(!MO)
    if (!MO) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.MO]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.MO]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.MO))
    }
  }

  const changeTU = () => {
    setTU(!TU)
    if (!TU) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.TU]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.TU]
        changeWeekDay(newWeekDay)
      }
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.TU))
    }
  }

  const changeWE = () => {
    setWE(!WE)
    if (!WE) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.WE]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.WE]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.WE))
    }
  }

  const changeTH = () => {
    setTH(!TH)
    if (!TH) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.TH]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.TH]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.TH))
    }
  }

  const changeFR = () => {
    setFR(!FR)
    if (!FR) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.FR]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.FR]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.FR))
    }
  }

  const changeSA = () => {
    setSA(!SA)
    if (!SA) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.SA]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.SA]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.SA))
    }
  }

  const changeSU = () => {
    setSU(!SU)
    if (!SU) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.SU]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.SU]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.SU))
    }
  }

  const changeEnableWeekDay = (value: boolean) => {
    setIsWeekDay(value)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
      <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '90%'}}>
        <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '100%'}}>
          <Pressable onPress={showRecurringEndDatePicker}>
            <Text variant="buttonLink">
              End Date for Recurrence: {dayjs(recurringEndDate).format('MMMM D, h:mm A')}
            </Text>
          </Pressable>
        </Box>
          <DatePicker
            modal
            open={isRecurring}
            date={recurringEndDate}
            onConfirm={(date) => {
              changeRecurringEndDate(date)
              hideRecurringEndDatePicker()
            }}
            onCancel={() => {
              hideRecurringEndDatePicker()
            }}
          theme={dark ? 'dark' : 'light'}
          />
      </Box>
      <Box flex={3} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center" style={{ width: '100%'}}>
        <Picker
          selectedValue={frequency}
          onValueChange={changeFrequency}
          style={{ color: dark ? palette.white : palette.textBlack, height: 150, width: '70%' }}
        >
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="daily" value="daily" label="Daily" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="weekly" value="weekly" label="Weekly" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="monthly" value="monthly" label="Monthly" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="yearly" value="yearly" label="Yearly" />
        </Picker>
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader">
            Interval (ex: every 2 weeks)
          </Text>
        </Box>
        <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-end"  style={{ width: '90%'}}>
          <TextField
            type="numeric"
            onChangeText={(text: string) => changeInterval(text.replace(/[^0-9.]/g, '') || '0')}
            value={interval}
            placeholder="1"
            style={{ width: '20%' }}
          />
        </Box>
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }}  justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
              {`Choose specific days of the week? ${byWeekDay?.length > 0 ? ' specific days selected' : ''}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '90%'}}>
            <Switch
                onColor={Colors.purple30}
                offColor={Colors.purple60}
                value={isWeekDay}
                onValueChange={changeEnableWeekDay}
                style={{marginBottom: 20}}
            />
        </Box>
      </Box>
      <Dialog
        bottom
        visible={isWeekDay}
        onDismiss={hideIsWeekDay}
        useSafeArea
        pannableHeaderProps={{ title: 'Pick days of the week' }}
      >
         <Box justifyContent="center" alignItems="center">
            <RegularCard>
              <Box width="100%" flexDirection="row" justifyContent="space-evenly" m={{ phone: 's', tablet: 'm' }}>
                <TouchableOpacity onPress={changeMO} style={[styles.day, { backgroundColor: MO ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: MO ? palette.white : palette.textBlack }}>
                      MO
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={changeTU} style={[styles.day, { backgroundColor: TU ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: TU ? palette.white : palette.textBlack }}>
                      TU
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={changeWE} style={[styles.day, { backgroundColor: WE ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: WE ? palette.white : palette.textBlack }}>
                      WE
                    </Text>
                </TouchableOpacity>
              </Box>
              <Box width="100%" flexDirection="row" justifyContent="space-evenly" m={{ phone: 's', tablet: 'm' }}>
                <TouchableOpacity onPress={changeTH} style={[styles.day, { backgroundColor: TH ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: TH ? palette.white : palette.textBlack }}>
                      TH
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={changeFR} style={[styles.day, { backgroundColor: FR ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: FR ? palette.white : palette.textBlack }}>
                      FR
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={changeSA} style={[styles.day, { backgroundColor: SA ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: SA ? palette.white : palette.textBlack }}>
                      SA
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={changeSU} style={[styles.day, { backgroundColor: SU ? palette.purplePrimary : palette.lightGray }]}>
                    <Text variant="optionHeader" style={{color: SU ? palette.white : palette.textBlack }}>
                      SU
                    </Text>
                </TouchableOpacity>
                
              </Box>

              <Pressable onPress={hideIsWeekDay}>
                <Text variant="buttonLink"> Close</Text>
              </Pressable>
            </RegularCard>
            
          </Box>
      </Dialog>
    </Box>
  )
}

export default CreateEventRecurStepAlt
/** end */
