
import { dayjs } from '@lib/date-utils'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'

import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

import { Appearance, Dimensions, KeyboardAvoidingView, Platform, Pressable, StyleSheet, ScrollView } from 'react-native'
import { palette } from '@lib/theme/theme'
import _ from 'lodash'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { Input } from '@chakra-ui/react'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
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
    notes: string,
    windowStartDate: Date,
    windowEndDate: Date,
    location: string | undefined,
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
    const [location, setLocation] = useState<string | undefined>(props?.location)
    const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState<boolean>(false)
    const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState<boolean>(false)
    const [cancel, setCancel] = useState<boolean>(props?.cancel)
    const [pageOffset, setPageOffset] = useState<number>(0)

    const { height: fullHeight } = Dimensions.get('window')
    
    useEffect(() => {
        if (windowStartDate !== props?.windowStartDate) {
            setWindowStartDate(props?.windowStartDate)
        }
    }, [props?.windowStartDate, windowStartDate])

    useEffect(() => {
        if (windowEndDate !== props?.windowEndDate) {
            setWindowEndDate(props?.windowEndDate)
        }
    }, [props?.windowEndDate, windowEndDate])

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
        <Box flex={1} style={{ width: '100%' }}>
            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center'}}>
                <Box flex={1} p={{ phone: 's', tablet: 'm' }} style={{ width: '80%'}}>
                    <Text variant="optionHeader">
                            Start
                    </Text>
                   <Input
                        placeholder="Select Date and Time"
                        size="md"
                        type="datetime-local"
                        onChange={(e) => {
                            const durationMinutes = dayjs.duration(dayjs(windowEndDate).diff(dayjs(windowStartDate))).asMinutes()
                            const newEndDate = dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").add(durationMinutes, 'minutes').toDate()
                            changeWindowStartDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                            changeWindowEndDate(newEndDate)
                        }}
                        value={dayjs(windowStartDate).format("YYYY-MM-DDTHH:mm")}
                    />
                    
                </Box>
                <Box flex={1} p={{ phone: 's', tablet: 'm' }} style={{ width: '80%'}}>
                    <Pressable onPress={showEndDatePicker}>
                        <Text variant="optionHeader">
                            End
                        </Text>
                    </Pressable>
                    <Input
                        placeholder="Select Date and Time"
                        size="md"
                        type="datetime-local"
                        onChange={(e) => {
                            changeWindowEndDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                            
                        }}
                        value={dayjs(windowEndDate).format("YYYY-MM-DDTHH:mm")}
                    />
                   
                </Box>
                <Box p={{ phone: 's', tablet: 'm' }}>
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                        <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                            Do you want to cancel this meeting assist?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1

                            checked={cancel}
                            onValueChange={changeCancel}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box flex={1} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%'}}>
                    <Box>
                        
                            <TextField
                                label="Title"
                                placeholder="title"
                                multiline={true}
                                numberOfLines={4}
                                onChange={(e: { target: { value: string } }) => changeSummary(e?.target?.value)}
                                value={summary || props?.summary}
                                style={{ width: '100%'}}
                            />
                
                    </Box>
                </Box>
                <Box flex={1} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%' }}>
                    
                        <TextField
                            placeholder="notes"
                            onChange={(e: { target: { value: string } }) => changeNotes(e?.target?.value)}
                            value={notes || props?.notes}
                            style={{ width: '100%'}}
                            multiline={true}
                            numberOfLines={4}
                        />
                    
                </Box>
                <Box flex={1} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '80%' }}>
                    
                    <TextField
                        label="Location"
                        placeholder="location if any"
                        onChange={(e: { target: { value: string } }) => changeLocation(e?.target?.value)}
                        value={location || props?.location}
                        style={{ width: '100%'}}
                    />
                    
                </Box>
            </ScrollView>
           
        </Box>
    )

}

export default EditMeetingAssistBaseStep


