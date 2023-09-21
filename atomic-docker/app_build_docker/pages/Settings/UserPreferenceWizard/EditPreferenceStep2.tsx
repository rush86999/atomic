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
//  import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
  import { dayjs, } from '@lib/date-utils'

  
  import Box from '@components/common/Box'
  import Text from '@components/common/Text'
  
  import _ from 'lodash'
  import { EndTimeType, StartTimeType } from '@lib/dataTypes/User_PreferenceType'
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
  
  function EditPreferenceStep2(props: Props) {
      const [startTimes, setStartTimes] = useState<StartTimeType[]>(props?.startTimes || DEFAULT_START_TIMES as StartTimeType[])
      const [endTimes, setEndTimes] = useState<EndTimeType[]>(props?.endTimes || DEFAULT_END_TIMES as EndTimeType[])
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
          console.log(day, hour, minutes, 'day, hour, minutes, onStartTimeChange')
          switch (day) {
              case 1:
                  const findIndex = startTimes.findIndex(i => i.day === 1)
                  console.log(findIndex, 'findIndex')
                  if (findIndex !== -1) {
                      const newStartTimes = _.cloneDeep(startTimes)
                      newStartTimes[findIndex].hour = hour
                      newStartTimes[findIndex].minutes = minutes
                      console.log(newStartTimes, 'newStartTimes')
                      setStartTimes(newStartTimes)
                      setParentStartTimes(newStartTimes)
                  }
                  break
              case 2:
                  const findIndex2 = startTimes.findIndex(i => i.day === 2)
                  if (findIndex2 !== -1) {
                    const newStartTimes = _.cloneDeep(startTimes)
                    console.log(newStartTimes, 'newStartTimes')

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
          console.log(day, hour, minutes, 'day, hour, minutes, onEndTimeChange')
          switch (day) {
              case 1:
                  const findIndex = endTimes.findIndex(i => i.day === 1)
                  if (findIndex !== -1) {
                      const newEndTimes = _.cloneDeep(endTimes)
                        newEndTimes[findIndex].hour = hour
                        newEndTimes[findIndex].minutes = minutes
                      console.log(newEndTimes, 'newEndTimes')
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
            <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }} flex={1} justifyContent="center" alignItems="center">
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onMonStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(monStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onMonEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(monEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onTueStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(tueStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onTueEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(tueEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onWedStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(wedStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onWedEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(wedEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onThuStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(thuStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onThuEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(thuEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onFriStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(friStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onFriEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(friEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onSatStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(satStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onSatEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(satEndTimeDate).format('HH:mm')}
                                
                            />
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
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onSunStartTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(sunStartTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                    <Box mb={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '40%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Text variant="cardTitle">
                                End Time
                            </Text>
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    onSunEndTimeDateChange(dayjs(e?.target?.value, 'HH:mm').toDate())
                                }}
                                value={dayjs(sunEndTimeDate).format('HH:mm')}
                                
                            />
                        </Box>
                    </Box>
                </ScrollView>
            </Box>
        </Box>
      )
  }
  
  export default EditPreferenceStep2