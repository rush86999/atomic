import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { dayjs } from '@lib/date-utils'
// import DatePicker from 'react-native-date-picker'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import TextField from '@components/TextField'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Appearance, Dimensions, Pressable, ScrollView, StyleSheet } from 'react-native'
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

function CreateEventBaseStep(props: Props) {
  const [title, setTitle] = useState<string>(props?.title)
  const [notes, setNotes] = useState<string>(props?.notes)
  const [location, setLocation] = useState<string>(props?.location)
  const [startDate, setStartDate] = useState<Date>(props?.startDate)
  const [endDate, setEndDate] = useState<Date>(props?.endDate)
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState<boolean>(false)
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState<boolean>(false)
  const [pageOffset, setPageOffset] = useState<number>(0)

  const { height: fullHeight } = Dimensions.get('window')
  

  const setParentTitle = props?.setParentTitle
  const setParentNotes = props?.setParentNotes
  const setParentLocation = props?.setParentLocation
  const setParentEndDate = props?.setParentEndDate
  const setParentStartDate = props?.setParentStartDate



  const onLayout = ({
        nativeEvent: {
        layout: {height: height1},
      },
  }: { nativeEvent: { layout: { height: number}}}) => {
      const pageOffset1 = fullHeight - height1
      setPageOffset(pageOffset1)
  }

  // useEffect(() => {}, [])

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
    <Box flex={1} style={{ width: '100%' }} onLayout={onLayout}>
        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center'}}> 
          <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} p={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
             
                <Text variant="optionHeader">
                  Start
                </Text>
             <Input
                placeholder="Select Date and Time"
                size="md"
                type="datetime-local"
                onChange={(e) => {
                  const durationMinutes = dayjs.duration(dayjs(endDate).diff(dayjs(startDate))).asMinutes()
                  const newEndDate = dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").add(durationMinutes, 'minutes').toDate()
                  changeStartDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                  changeEndDate(newEndDate)
               
                }}
                value={dayjs(startDate).format("YYYY-MM-DDTHH:mm")}
              />
              
            </Box>
            <Box flex={1} p={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
              
                <Text variant="optionHeader">
                  End
                </Text>
                <Input
                  placeholder="Select Date and Time"
                  size="md"
                  type="datetime-local"
                  onChange={(e) => {
                    changeEndDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                  
                  }} 
                  value={dayjs(endDate).format("YYYY-MM-DDTHH:mm")}
                />
            </Box>
            <Box flex={1} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
              <Box>
                <TextField
                  label="Title"
                  placeholder="title"
                  onChange={(e: { target: { value: string } }) => changeTitle(e?.target?.value)}
                  value={title || props?.title}
                  style={{ width: '100%'}}
                />
              </Box>
            </Box>
            <Box flex={3} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
              <TextField
                label="Notes"
                onChange={(e: { target: { value: string } }) => changeNotes(e?.target?.value)}
                value={notes || props?.notes}
                style={{ width: '100%'}}
                multiline
                numberOfLines={3}
              />
            </Box>
            <Box flex={1} p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
              <TextField
                label="Location"
                placeholder="location if any"
                onChange={(e: { target: { value: string } }) => changeLocation(e?.target?.value)}
                value={location || props?.location}
                style={{ width: '100%'}}
              />
            </Box>
            </Box>
        </ScrollView>
    </Box>
  )
}

export default CreateEventBaseStep

/** end */
