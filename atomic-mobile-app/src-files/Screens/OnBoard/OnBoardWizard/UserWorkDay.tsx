import React, {
    useState,
    Dispatch,
    SetStateAction,
  } from 'react'
  import {
      Pressable,
      useColorScheme,
      ScrollView,
  } from 'react-native'
  import DatePicker from 'react-native-date-picker'
  import { dayjs } from '@app/date-utils'
  
  import Box from '@components/common/Box'
  import Text from '@components/common/Text'
  
  import _ from 'lodash'
  import { EndTimeType, StartTimeType } from '@app/dataTypes/User_PreferenceType'
  
  
  type Props = {
      startTimes: StartTimeType[],
      setParentStartTimes: Dispatch<SetStateAction<StartTimeType[]>>,
      endTimes: EndTimeType[],
      setParentEndTimes: Dispatch<SetStateAction<EndTimeType[]>>,
  }
  
  type dayOfWeekInt = 1 | 2 | 3 | 4 | 5 | 6 | 7
  
  const DEFAULT_START_TIMES = [
      {
          day: 1,
          hour: 7,
          minutes: 0,
      },
      {
          day: 2,
          hour: 7,
          minutes: 0,
      },
      {
          day: 3,
          hour: 7,
          minutes: 0,
      },
      {
          day: 4,
          hour: 7,
          minutes: 0,  
      },
      {
          day: 5,
          hour: 7,
          minutes: 0,  
      },
      {
          day: 6,
          hour: 7,
          minutes: 0,
      },
      {
          day: 7,
          hour: 7,
          minutes: 0,
      }
  ]
  
  const DEFAULT_END_TIMES = [
      {
          day: 1,
          hour: 19,
          minutes: 0,
      },
      {
          day: 2,
          hour: 19,
          minutes: 0,
      },
      {
          day: 3,
          hour: 19,
          minutes: 0,
      },
      {
          day: 4,
          hour: 19,
          minutes: 0,
      },
      {
          day: 5,
          hour: 19,
          minutes: 0,
      },
      {
          day: 6,
          hour: 19,
          minutes: 0,
      },
      {
          day: 7,
          hour: 19,
          minutes: 0,
      }
  ]
  
  function UserWorkDay(props: Props) {
      const [startTimes, setStartTimes] = useState<StartTimeType[]>(props?.startTimes || DEFAULT_START_TIMES as StartTimeType[])
      const [endTimes, setEndTimes] = useState<EndTimeType[]>(props?.endTimes || DEFAULT_END_TIMES as EndTimeType[])
      const [isMonStart, setIsMonStart] = useState<boolean>(false)
      const [isTueStart, setIsTueStart] = useState<boolean>(false)
      const [isWedStart, setIsWedStart] = useState<boolean>(false)
      const [isThuStart, setIsThuStart] = useState<boolean>(false)
      const [isFriStart, setIsFriStart] = useState<boolean>(false)
      const [isSatStart, setIsSatStart] = useState<boolean>(false)
      const [isSunStart, setIsSunStart] = useState<boolean>(false)
      const [isMonEnd, setIsMonEnd] = useState<boolean>(false)
      const [isTueEnd, setIsTueEnd] = useState<boolean>(false)
      const [isWedEnd, setIsWedEnd] = useState<boolean>(false)
      const [isThuEnd, setIsThuEnd] = useState<boolean>(false)
      const [isFriEnd, setIsFriEnd] = useState<boolean>(false)
      const [isSatEnd, setIsSatEnd] = useState<boolean>(false)
      const [isSunEnd, setIsSunEnd] = useState<boolean>(false)
      const [monStartTimeDate, setMonStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 1)).hour).minute(props?.startTimes.find(i => (i?.day === 1)).minutes).toDate())
      const [tueStartTimeDate, setTueStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 2)).hour).minute(props?.startTimes.find(i => (i?.day === 2)).minutes).toDate())
      const [wedStartTimeDate, setWedStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 3)).hour).minute(props?.startTimes.find(i => (i?.day === 3)).minutes).toDate())
      const [thuStartTimeDate, setThuStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 4)).hour).minute(props?.startTimes.find(i => (i?.day === 4)).minutes).toDate())
      const [friStartTimeDate, setFriStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 5)).hour).minute(props?.startTimes.find(i => (i?.day === 5)).minutes).toDate())
      const [satStartTimeDate, setSatStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 6)).hour).minute(props?.startTimes.find(i => (i?.day === 6)).minutes).toDate())
      const [sunStartTimeDate, setSunStartTimeDate] = useState<Date>(dayjs().hour(props?.startTimes.find(i => (i?.day === 7)).hour).minute(props?.startTimes.find(i => (i?.day === 7)).minutes).toDate()) 
      const [monEndTimeDate, setMonEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 1)).hour).minute(props?.endTimes.find(i => (i?.day === 1)).minutes).toDate())
      const [tueEndTimeDate, setTueEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 2)).hour).minute(props?.endTimes.find(i => (i?.day === 2)).minutes).toDate())
      const [wedEndTimeDate, setWedEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 3)).hour).minute(props?.endTimes.find(i => (i?.day === 3)).minutes).toDate())
      const [thuEndTimeDate, setThuEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 4)).hour).minute(props?.endTimes.find(i => (i?.day === 4)).minutes).toDate())
      const [friEndTimeDate, setFriEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 5)).hour).minute(props?.endTimes.find(i => (i?.day === 5)).minutes).toDate())
      const [satEndTimeDate, setSatEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 6)).hour).minute(props?.endTimes.find(i => (i?.day === 6)).minutes).toDate())
      const [sunEndTimeDate, setSunEndTimeDate] = useState<Date>(dayjs().hour(props?.endTimes.find(i => (i?.day === 7)).hour).minute(props?.endTimes.find(i => (i?.day === 7)).minutes).toDate())
  
      const setParentStartTimes = props?.setParentStartTimes
      const setParentEndTimes = props?.setParentEndTimes
      
      const dark = useColorScheme() === 'dark'
  
      const onStartTimeChange = (day: dayOfWeekInt, hour: number, minutes: number) => {
          
          switch (day) {
              case 1:
                  const findIndex = startTimes.findIndex(i => i.day === 1)
                  
                  if (findIndex !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex].hour = hour
                      newStartTimes[findIndex].minutes = minutes
                      
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 2:
                  const findIndex2 = startTimes.findIndex(i => i.day === 2)
                  if (findIndex2 !== -1) {
                    const newStartTimes = _.cloneDeep(startTimes)
                    

                    newStartTimes[findIndex2].hour = hour
                    newStartTimes[findIndex2].minutes = minutes
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 3:
                  const findIndex3 = startTimes.findIndex(i => i.day === 3)
                  if (findIndex3 !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex3].hour = hour
                      newStartTimes[findIndex3].minutes = minutes
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 4:
                  const findIndex4 = startTimes.findIndex(i => i.day === 4)
                  if (findIndex4 !== -1) {
                    const newStartTimes = _.cloneDeep(startTimes)
                    newStartTimes[findIndex4].hour = hour
                    newStartTimes[findIndex4].minutes = minutes
                    setStartTimes(newStartTimes)
                    setParentStartTimes(newStartTimes)
                  }
                  break
              case 5:
                  const findIndex5 = startTimes.findIndex(i => i.day === 5)
                  if (findIndex5 !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex5].hour = hour
                      newStartTimes[findIndex5].minutes = minutes
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 6:
                  const findIndex6 = startTimes.findIndex(i => i.day === 6)
                  if (findIndex6 !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex6].hour = hour
                        newStartTimes[findIndex6].minutes = minutes
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 7:
                  const findIndex7 = startTimes.findIndex(i => i.day === 7)
                  if (findIndex7 !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex7].hour = hour
                        newStartTimes[findIndex7].minutes = minutes
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
          }
      }
  
      const onEndTimeChange = (day: dayOfWeekInt, hour: number, minutes: number) => {
          
          switch (day) {
              case 1:
                  const findIndex = endTimes.findIndex(i => i.day === 1)
                  if (findIndex !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                        newEndTimes[findIndex].hour = hour
                        newEndTimes[findIndex].minutes = minutes
                      
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 2:
                  const findIndex2 = endTimes.findIndex(i => i.day === 2)
                  if (findIndex2 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex2].hour = hour
                        newEndTimes[findIndex2].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 3:
                  const findIndex3 = endTimes.findIndex(i => i.day === 3)
                  if (findIndex3 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex3].hour = hour
                        newEndTimes[findIndex3].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 4:
                  const findIndex4 = endTimes.findIndex(i => i.day === 4)
                  if (findIndex4 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex4].hour = hour
                        newEndTimes[findIndex4].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 5:
                  const findIndex5 = endTimes.findIndex(i => i.day === 5)
                  if (findIndex5 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex5].hour = hour
                        newEndTimes[findIndex5].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 6:
                  const findIndex6 = endTimes.findIndex(i => i.day === 6)
                  if (findIndex6 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex6].hour = hour
                        newEndTimes[findIndex6].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
              case 7:
                  const findIndex7 = endTimes.findIndex(i => i.day === 7)
                  if (findIndex7 !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                      newEndTimes[findIndex7].hour = hour
                        newEndTimes[findIndex7].minutes = minutes
                      setEndTimes(newEndTimes)
                      setParentEndTimes(newEndTimes)
                  }
                  break
          }
      }
         
      const onMonStartTimeDateChange = (date: Date) => {
          setMonStartTimeDate(date)
          onStartTimeChange(1, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onTueStartTimeDateChange = (date: Date) => {
          setTueStartTimeDate(date)
          onStartTimeChange(2, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onWedStartTimeDateChange = (date: Date) => {
          setWedStartTimeDate(date)
          onStartTimeChange(3, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onThuStartTimeDateChange = (date: Date) => {
          setThuStartTimeDate(date)
          onStartTimeChange(4, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onFriStartTimeDateChange = (date: Date) => {
          setFriStartTimeDate(date)
          onStartTimeChange(5, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onSatStartTimeDateChange = (date: Date) => {
          setSatStartTimeDate(date)
          onStartTimeChange(6, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onSunStartTimeDateChange = (date: Date) => {
          setSunStartTimeDate(date)
          onStartTimeChange(7, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onMonEndTimeDateChange = (date: Date) => {
          setMonEndTimeDate(date)
          onEndTimeChange(1, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onTueEndTimeDateChange = (date: Date) => {
          setTueEndTimeDate(date)
          onEndTimeChange(2, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onWedEndTimeDateChange = (date: Date) => {
          setWedEndTimeDate(date)
          onEndTimeChange(3, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onThuEndTimeDateChange = (date: Date) => {
          setThuEndTimeDate(date)
          onEndTimeChange(4, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onFriEndTimeDateChange = (date: Date) => {
          setFriEndTimeDate(date)
          onEndTimeChange(5, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onSatEndTimeDateChange = (date: Date) => {
          setSatEndTimeDate(date)
          onEndTimeChange(6, dayjs(date).hour(), dayjs(date).minute())
      }
  
      const onSunEndTimeDateChange = (date: Date) => {
          setSunEndTimeDate(date)
          onEndTimeChange(7, dayjs(date).hour(), dayjs(date).minute())
      }
  
      return (
        <Box flex={1} style={{ width: '100%' }} justifyContent="center" alignItems="center">
            <Box style={{ width: '100%' }} flex={1} justifyContent="center" alignItems="center">
                <Box style={{ width: '80%' }} justifyContent="center" alignItems="center">
                    <Text variant="subheader">
                        Default Working Hours
                    </Text>
                </Box>
                <Box style={{ width: '80%' }} justifyContent="center" alignItems="center">
                    <Text variant="greyComment">
                        Tap on the time to change the default working hours for Monday to Sunday
                    </Text>
                </Box>
            </Box>
            <Box flex={3} style={{ width: '100%' }}>
                <ScrollView style={{ width: '100%' }} contentContainerStyle={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Monday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsMonStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(monStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsMonEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(monEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text textAlign="center" style={{ width: '100%' }} variant="optionHeader">
                            Tuesday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsTueStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(tueStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsTueEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(tueEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Wednesday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsWedStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(wedStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsWedEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(wedEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Thursday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsThuStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(thuStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsThuEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(thuEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Friday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsFriStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(friStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsFriEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(friEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Saturday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsSatStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(satStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsSatEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(satEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Sunday
                        </Text>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                Start Time
                            </Text>
                            <Pressable onPress={() => setIsSunStart(true)}>
                                <Text variant="cardLink">
                                    {dayjs(sunStartTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Pressable onPress={() => setIsSunEnd(true)}>
                                <Text variant="cardLink">
                                    {dayjs(sunEndTimeDate).format('hh:mm A')}
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                </ScrollView>
            </Box>
            <DatePicker
                modal
                open={isMonStart}
                date={monStartTimeDate}
                onConfirm={(date) => {
                setIsMonStart(false)
                onMonStartTimeDateChange(date)
                }}
                onCancel={() => {
                setIsMonStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isMonEnd}
                date={monEndTimeDate}
                onConfirm={(date) => {
                    setIsMonEnd(false)
                    onMonEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsMonEnd(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isTueStart}
                date={tueStartTimeDate}
                onConfirm={(date) => {
                    setIsTueStart(false)
                    onTueStartTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsTueStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isTueEnd}
                date={tueEndTimeDate}
                onConfirm={(date) => {
                    setIsTueEnd(false)
                    onTueEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsTueEnd(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isWedStart}
                date={wedStartTimeDate}
                onConfirm={(date) => {
                    setIsWedStart(false)    
                    onWedStartTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsWedStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isWedEnd}
                date={wedEndTimeDate}
                onConfirm={(date) => {
                    setIsWedEnd(false)
                    onWedEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsWedEnd(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isThuStart}
                date={thuStartTimeDate}
                onConfirm={(date) => {
                    setIsThuStart(false)
                    onThuStartTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsThuStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isThuEnd}
                date={thuEndTimeDate}
                onConfirm={(date) => {
                    setIsThuEnd(false)
                    onThuEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsThuEnd(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isFriStart}
                date={friStartTimeDate}
                onConfirm={(date) => {
                    setIsFriStart(false)
                    onFriStartTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsFriStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isFriEnd}
                date={friEndTimeDate}
                onConfirm={(date) => {
                    setIsFriEnd(false)
                    onFriEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsFriEnd(false)
                }}
                  mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isSatStart}
                date={satStartTimeDate}
                onConfirm={(date) => {
                    setIsSatStart(false)
                    onSatStartTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsSatStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isSatEnd}
                date={satEndTimeDate}
                onConfirm={(date) => {
                    setIsSatEnd(false)
                    onSatEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsSatEnd(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isSunStart}
                date={sunStartTimeDate}
                onConfirm={(date) => {
                    setIsSunStart(false)
                    onSunStartTimeDateChange(date)  
                }}
                onCancel={() => {
                    setIsSunStart(false)
                }}
                mode="time"
                theme={dark ? 'dark' : 'light'}
            />
            <DatePicker
                modal
                open={isSunEnd}
                date={sunEndTimeDate}
                onConfirm={(date) => {
                    setIsSunEnd(false)
                    onSunEndTimeDateChange(date)
                }}
                onCancel={() => {
                    setIsSunEnd(false)
                }}
                  mode="time"
                theme={dark ? 'dark' : 'light'}
            />
        </Box>
      )
  }
  
  export default UserWorkDay