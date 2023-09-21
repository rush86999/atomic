import React, {
  useState,
  Dispatch,
  SetStateAction,
    useRef,
  useEffect,
} from 'react'

import { IoIosRemoveCircleOutline, IoIosAdd } from "react-icons/io"
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultTimePreferenceType, DefaultTimePreferenceTypes, Time } from '@lib/dataTypes/CategoryType'
import _ from 'lodash'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import { dayjs } from '@lib/date-utils'
import { getISODay, setISODay } from 'date-fns'
import { useToast } from '@chakra-ui/react'
import RegularCard from '@components/RegularCard'
import { FlatList, Pressable, Appearance } from 'react-native'
import { palette } from '@lib/theme/theme'
import Button from '@components/Button'
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
    // const [dayOfWeekObject, setDayOfWeekObject] = useState<{label: string, value: number }>(null)
    const [startTimeRange, setStartTimeRange] = useState<Date>(new Date())
    const [endTimeRange, setEndTimeRange] = useState<Date>(dayjs().add(30, 'm').toDate())
    const [isStartTimeRange, setIsStartTimeRange] = useState<boolean>(false)
    const [isEndTimeRange, setIsEndTimeRange] = useState<boolean>(false)

    const flatlistRef = useRef<FlatList>()
    const toast = useToast()
    // useEffect(() => {
    //     flatlistRef?.current?.scrollToEnd({animating: true})
    // }, [defaultTimePreference?.length])

    const setParentDefaultTimePreference = props?.setParentDefaultTimePreference

    const changeDefaultTimePreference = (value: DefaultTimePreferenceTypes) => {
        setDefaultTimePreferences(value)
        setParentDefaultTimePreference(value)
    }

     const hideStartTimeRangePicker = () => setIsStartTimeRange(false)
    
    const showStartTimeRangePicker = () => setIsStartTimeRange(true)

    const hideEndTimeRangePicker = () => setIsEndTimeRange(false)

    const showEndTimeRangePicker = () => setIsEndTimeRange(true)

    const changeDayOfWeek = (item: number) => {
        setDayOfWeek(item as DayOfWeekIntType)
    }

    const addItem = async () => {
        try {
            // validate startTime, endTime, eventId, and dayOfWeek
            if (!startTimeRange) {
                toast({
                    title: 'Start time is required',
                    description: 'Please select a start time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (!endTimeRange) {
                toast({
                    title: 'End time is required',
                    description: 'Please select an end time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (dayOfWeek < -1 || dayOfWeek > 7) {
                toast({
                    title: 'Day of week is required',
                    description: 'Please select a day of week',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            // validate startTimeRange and endTimeRange
            if (startTimeRange.getTime() >= endTimeRange.getTime()) {
                toast({
                    title: 'Start time must be before end time',
                    description: 'Please select a start time before end time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(startTimeRange), 'm')

            if (timeRangeDuration < 30) {
                toast({
                    title: 'End time must be same or longer than 30 minutes',
                    description: 'Please select a end time that is same or longer than 30 minutes',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
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

            // clear form
            setStartTimeRange(new Date())
            setEndTimeRange(dayjs().add(30, 'm').toDate())
            setDayOfWeek(-1)

        } catch (e) {
            console.log(e, ' e unable to add item to preferred time ranges')
        }
    }

    const removeItem = async (index: number) => {
        try {
            // validate item
            if (!defaultTimePreferences[index]) {
                toast({
                    title: 'Item is required',
                    description: 'Please select an item',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const cloneDefulatTimePreferences = _.reverse(_.cloneDeep(defaultTimePreferences))
            const newdefaultTimePreference = cloneDefulatTimePreferences.filter((item, i) => i !== index)   
            changeDefaultTimePreference(newdefaultTimePreference)
        } catch (e) {
            console.log(e, ' e unable to remove item from preferred time ranges inside editcategorystep3')
        }
    }


     const renderItem = ({ item, index }: RenderPreferredTimeRangeType) => (
        <Box justifyContent="center" alignItems="center">
            <RegularCard>
                <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                    {(((item?.dayOfWeek === -1) || (item?.dayOfWeek === null))) ? 'Any day of week' : dayjs(setISODay(dayjs().toDate(), item.dayOfWeek)).format('dddd')}
                </Text>
                <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                    {dayjs(item.startTime, 'HH:mm').format('h:mm A')}
                    {' - '}
                    {dayjs(item.endTime, 'HH:mm').format('h:mm A')}
                </Text>
                <Pressable onPress={() => removeItem(index)}>
                    <Text pt={{ phone: 'm', tablet: 's' }} variant="buttonLink">
                        <IoIosRemoveCircleOutline color={palette.pinkPrimary} name="ios-remove-circle-outline" size="2em" />
                        {' '}
                        Remove
                    </Text>
                </Pressable>
            </RegularCard>
        </Box>
    )

    const timePreferenceAvailable = defaultTimePreferences?.length > 0
    return (
        <Box  justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box mt={{ phone: 's', tablet: 'm' }}  justifyContent="center" alignItems="center">
                <Text variant="subheader">
                    Preferred Times
                </Text>
            </Box>
            <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: '50vh' }}>
                <Box justifyContent="center" alignItems="flex-start"  style={{ width: '100%'}} minHeight="40vh" maxHeight="40vh">
                    <FlatList
                        style={{ flex: 1 }}
                        data={timePreferenceAvailable ? _.reverse(_.cloneDeep(defaultTimePreferences)) : null}
                        keyExtractor={item => `${item.startTime}-${item.endTime}-${item.dayOfWeek}`}
                        renderItem={renderItem}
                        // extraData={`${timeRangePreferences.map(i => i?.id)}`}
                    />
                </Box>
                <Box justifyContent="center" alignItems="flex-start" style={{ width: '100%' }}>
                <div className="flex flex-wrap justify-center w-full">
                    <Box pl={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-start">
                        <Text variant="optionHeader">Start Time</Text>
                    <Input
                            placeholder="Select Time"
                            size="md"
                            type="time"
                            onChange={(e) => {
                                setStartTimeRange(dayjs(e?.target?.value, "HH:mm").toDate())
                                const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(e?.target?.value), 'm')
                                if (timeRangeDuration < 30) {
                                    setEndTimeRange(dayjs(e?.target?.value, "HH:mm").add(30, 'm').toDate())
                                }
                            }}
                            value={dayjs(startTimeRange).format("HH:mm")}
                        />
                    </Box>
                    <Box pl={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-start">
                    <Text variant="optionHeader">End Time</Text>
                    <Input
                        placeholder="Select Time"
                        size="md"
                        type="time"
                        onChange={(e) => {
                            setEndTimeRange(dayjs(e?.target?.value, "HH:mm").toDate())
                        }}
                        value={dayjs(endTimeRange).format("HH:mm")}
                        
                    />
                    </Box>
                </div>
                <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center" width="100%">
                    <Text variant="optionHeader">Day Of Week</Text>
                    <select value={dayOfWeek} onChange={(e) => changeDayOfWeek(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10) || -1)} className="select select-primary w-full max-w-xs">
                        <option disabled selected>Pick a day of the week</option>
                        {_.map(dayOfWeekInt, option => (
                            <option
                                key={option}
                                value={option}
                            >{(option !== -1 ? dayjs(setISODay(dayjs().toDate(), option)).format('dddd') : 'Any day of the week')}</option>
                            ))}
                    </select>
                </Box>
                </Box>
                </div>
            <Box  justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Pressable onPress={addItem}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                        <IoIosAdd size="3em" color={palette.pinkPrimary} />
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



