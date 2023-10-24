import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import EditBreakPreferenceColor from '@pages/Settings/UserPreferenceWizard/EditBreakPreferenceColor'
import { Pressable, ScrollView } from 'react-native'

import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import Circle from '@uiw/react-color-circle'

const INITIAL_COLOR = Colors.blue30

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
    copyIsMeeting: boolean,
    copyIsExternalMeeting: boolean,
    copyColor: boolean,
    backToBackMeetings: boolean,
    breakColor: string,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    setParentCopyColor: Dispatch<SetStateAction<boolean>>,
    setParentBackToBackMeetings: Dispatch<SetStateAction<boolean>>,
    setParentBreakColor: Dispatch<SetStateAction<string>>,
}

function EditPreferenceStep6(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting)
    const [copyColor, setCopyColor] = useState<boolean>(props?.copyColor)
    const [backToBackMeetings, setBackToBackMeetings] = useState<boolean>(props?.backToBackMeetings)
    const [breakColor, setBreakColor] = useState<string>(props?.breakColor || INITIAL_COLOR)
    const [enableSelectColor, setEnableSelectColor] = useState<boolean>(false)
    
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentCopyColor = props?.setParentCopyColor
    const setParentBackToBackMeetings = props?.setParentBackToBackMeetings
    const setParentBreakColor = props?.setParentBreakColor
    
    const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
    }
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }
    
    const changeCopyColor = (value: boolean) => {
        setCopyColor(value)
        setParentCopyColor(value)
    }

    const changeBackToBackMeetings = (value: boolean) => {
        setBackToBackMeetings(value)
        setParentBackToBackMeetings(value)
    }

    const changeBreakColor = (value: string) => {
        setBreakColor(value)
        setParentBreakColor(value)
    }

    if (enableSelectColor) {
        return (
            <EditBreakPreferenceColor
                breakColor={breakColor}
                setParentBreakColor={changeBreakColor}
                setParentEnableSelectColor={setEnableSelectColor}
            />
        )
    }
    
    return (
        <Box justifyContent="center" alignItems="center" width="100%">
          <Box justifyContent="center" alignItems="center" minHeight="70vh">
              <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                  <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">Select color for any new events classified as a &apos;break type&apos; event</Text>
                  </Box>
                  <Box  flexDirection="row" justifyContent="flex-end" alignItems="center">  
                    <Circle
                        colors={[ '#039be5', '#7986cb', '#33b679', '#8e24aa', '#e67c73', '#f6c026', '#f5511d', '#616161', '#3f51b5', '#0b8043', '#d60000' ]}
                        color={breakColor}
                        onChange={(color) => {
                            changeBreakColor(color.hex);
                        }}
                    />

                  </Box>
              </Box>
              <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                  <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">Enable back-to-back meetings with no breaks for scheduling assists? </Text>
                  </Box>
                  <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                      <Switch1
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          checked={backToBackMeetings}
                          onValueChange={changeBackToBackMeetings}
                      />
                  </Box>
              </Box>
              <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                  <Box  flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                      <Text variant="optionHeader">In general, once trained, classify any new events whose details are similar to a &apos;meeting type&apos; event as a &apos;meeting type&apos; for scheduling assists? </Text>
                  </Box>
                  <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                      <Switch1
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          checked={copyIsMeeting}
                          onValueChange={changeCopyIsMeeting}
                          style={{ marginBottom: 20 }}
                      />
                  </Box>
              </Box>
              <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                  <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">In general, once trained, classify any new events whose details are similar to an &apos;external meeting type&apos; event (meeting with a contact outside the organization) as an &apos;external meeting type&apos; for scheduling assists? </Text>
                  </Box>
                  <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                      <Switch1
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          checked={copyIsExternalMeeting}
                          onValueChange={changeCopyIsExternalMeeting}
                          style={{ marginBottom: 20 }}
                      />
                  </Box>
              </Box>
              <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                  <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">
                      <Text variant="optionHeader">Copy over background color to any new events whose details are similar? </Text>
                  </Box>
                  <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                      <Switch1
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          checked={copyColor}
                          onValueChange={changeCopyColor}
                      />
                  </Box>
              </Box>
          </Box>
        </Box>
    )
}

export default EditPreferenceStep6