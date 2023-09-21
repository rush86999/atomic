import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
 } from 'react'
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
 } from 'react-native'
import TextField from '@components/TextField'
import { IoIosClose } from "react-icons/io";
import {Picker} from '@react-native-picker/picker'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@lib/theme/theme'
import { VisibilityType } from '@lib/calendarLib/types'
import { addItemToAlarms, removeItemFromAlarms } from '@lib/Calendar/CreateEventWizard/wizardHelper'
import _ from 'lodash'
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
  setParentVisibility: Dispatch<SetStateAction<VisibilityType>>,
  userId: string,
  visibility: VisibilityType,
  alarms: number[],
  setParentAlarms: Dispatch<SetStateAction<number[]>>,
}

function EditEventVisibilityAndAlarmsStep(props: Props) {
  const [visibility, setVisibility] = useState<VisibilityType>(props?.visibility)
  const [alarms, setAlarms] = useState<number[]>(props?.alarms || [])
  const [alarm, setAlarm] = useState<number>(0)
  const [pageOffset, setPageOffset] = useState<number>(0)

  const {height: fullHeight} = Dimensions.get('window')

  const dark = useColorScheme() === 'dark'
  const setParentVisibility = props?.setParentVisibility
  const setParentAlarms = props?.setParentAlarms

  console.log(props?.alarms, ' props?.alarms')

  useEffect((): void => {
    if (props?.visibility !== visibility) {
      setVisibility(props?.visibility)
    }

    if (!_.isEqual(props?.alarms, alarms)) {
      setAlarms(props?.alarms)
    }
  }, [visibility, alarms, props?.visibility, props?.alarms])

  const onVisibilityChange = (value: VisibilityType) => {
    setVisibility(value)
    setParentVisibility(value)
  }

  return (
    <Box flex={1} style={{ width: '100%' }}>

          <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Text variant="optionHeader">
                Make this event private or public
              </Text>
            </Box>
            <Box flex={3}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Picker
                selectedValue={visibility}
                onValueChange={onVisibilityChange}
              >
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="default" value="default" label="Default" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="public" value="public" label="Public" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="private" value="private" label="Private" />
              </Picker>
            </Box>
            <Box flex={3}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <FlatList
                data={alarms}
                renderItem={({ item, index }) => (
                  <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                    <Box flexDirection="row" justifyContent="space-between" style={{ width: '70%'}}>
                      <Text variant="optionHeader">
                        {`${item} minutes before`}
                      </Text>
                      <Pressable hitSlop={15} onPress={() => removeItemFromAlarms(index, alarms, setAlarms, setParentAlarms)}>
                        <IoIosClose size="3em" color={palette.red} />
                      </Pressable>
                    </Box>
                  </Box>
                )}
                keyExtractor={(item, index) => `${item}-${index}`}
              />
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Box flex={1}  flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '40%'}}>
                <div className="mr-2">

                  
                  <TextField
                    type="number"
                    onChange={(e: { target: { value: string } }) => setAlarm(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                    value={`${alarm}`}
                    placeholder="0"
                    
                    />

                </div>
                <div className="ml-4">
                    <Pressable onPress={() => addItemToAlarms(alarm, alarms, setAlarms, setParentAlarms, setAlarm)}>
                      <Text variant="buttonLink">
                        Add Reminder
                      </Text>
                    </Pressable>
                  </div>
              </Box>
            </Box>
          </Box>
    </Box>
  )
}

export default EditEventVisibilityAndAlarmsStep
 /** end */
