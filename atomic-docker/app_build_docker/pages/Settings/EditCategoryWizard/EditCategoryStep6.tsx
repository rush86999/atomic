import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Tooltip } from '@chakra-ui/react'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import _ from 'lodash'
import Circle from '@uiw/react-color-circle'
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
    color: string,
    setParentColor: Dispatch<SetStateAction<string>>,
    copyIsMeeting: boolean,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    copyIsExternalMeeting: boolean,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    defaultIsMeeting: boolean,
    setParentDefaultIsMeeting: Dispatch<SetStateAction<boolean>>,
    defaultIsExternalMeeting: boolean,
    setParentDefaultIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    defaultMeetingModifiable: boolean,  
    setParentDefaultMeetingModifiable: Dispatch<SetStateAction<boolean>>,
    defaultExternalMeetingModifiable: boolean,
    setParentDefaultExternalMeetingModifiable: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep6(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting ?? false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting ?? false)
    const [defaultIsMeeting, setDefaultIsMeeting] = useState<boolean>(props?.defaultIsMeeting ?? false)
    const [defaultIsExternalMeeting, setDefaultIsExternalMeeting] = useState<boolean>(props?.defaultIsExternalMeeting ?? false)
    const [color, setColor] = useState<string>(props?.color)
    const [enableSelectColor, setEnableSelectColor] = useState<boolean>(false)
    const [defaultMeetingModifiable, setDefaultMeetingModifiable] = useState<boolean>(props?.defaultMeetingModifiable ?? false)
    const [defaultExternalMeetingModifiable, setDefaultExternalMeetingModifiable] = useState<boolean>(props?.defaultExternalMeetingModifiable ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)
    const [isMessage3, setIsMessage3] = useState<boolean>(false)
    const [isMessage4, setIsMessage4] = useState<boolean>(false)
    const [isMessage5, setIsMessage5] = useState<boolean>(false)
    
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentDefaultIsMeeting = props?.setParentDefaultIsMeeting
    const setParentDefaultIsExternalMeeting = props?.setParentDefaultIsExternalMeeting
    const setParentColor = props?.setParentColor
    const setParentDefaultMeetingModifiable = props?.setParentDefaultMeetingModifiable
    const setParentDefaultExternalMeetingModifiable = props?.setParentDefaultExternalMeetingModifiable
    
    const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
    }
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }
    
    const changeDefaultIsMeeting = (value: boolean) => {
        setDefaultIsMeeting(value)
        setParentDefaultIsMeeting(value)
    }
    
    const changeDefaultIsExternalMeeting = (value: boolean) => {
        setDefaultIsExternalMeeting(value)
        setParentDefaultIsExternalMeeting(value)
    }
    
    const changeColor = (value: string) => {
        setColor(value)
        setParentColor(value)
    }

    const changeDefaultMeetingModifiable = (value: boolean) => {
        setDefaultMeetingModifiable(value)
        setParentDefaultMeetingModifiable(value)
    }

    const changeDefaultExternalMeetingModifiable = (value: boolean) => {
        setDefaultExternalMeetingModifiable(value)
        setParentDefaultExternalMeetingModifiable(value)
    }

    return (
        <Box justifyContent="center" alignItems="center" width="100%">
            <div className="flex-1 flex flex-col justify-center items-center w-full">
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}> 
                    <Box style={{ width: '90%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                        <Text variant="optionHeader">Select color for any new events with the given tag</Text>
                    </Box>
                    <Box style={{ width: '90%' }} flexDirection="row" justifyContent="flex-end" alignItems="center"> 
                        <Circle
                            colors={[ '#039be5', '#7986cb', '#33b679', '#8e24aa', '#e67c73', '#f6c026', '#f5511d', '#616161', '#3f51b5', '#0b8043', '#d60000' ]}
                            color={color}
                            onChange={(color) => {
                                changeColor(color.hex);
                            }}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Tooltip hasArrow label='Event will be tagged with Meeting topic (if exists) and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.' bg='purple.700' color='white'>
                            <Text variant="optionHeader">Copy over &apos;meeting type&apos; value to any new event whose details have similar context to a past event and given tag for scheduling assists?</Text>
                        </Tooltip>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={copyIsMeeting}
                            onValueChange={changeCopyIsMeeting}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Tooltip hasArrow label='Tag with External Meeting topic (if available) is a meeting with contact outside the organization. Event will be tagged with external meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.' bg='purple.700' color='white'>
                            <Text variant="optionHeader">Copy over &apos;external meeting type&apos; value to any new event whose details have similar context  to a past event and given tag (meeting with a contact outside the organization) for scheduling assists? </Text>
                        </Tooltip>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={copyIsExternalMeeting}
                            onValueChange={changeCopyIsExternalMeeting}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">Classify any new events with the given tag as &apos;meeting type&apos; event for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={defaultIsMeeting}
                            onValueChange={changeDefaultIsMeeting}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">Classify any new events with the given tag as &apos;external meeting type&apos; event (meeting with a contact outside the organization) for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={defaultIsExternalMeeting}
                            onValueChange={changeDefaultIsExternalMeeting}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">By default lock (make static) any new events that are classified as &apos;meeting type&apos; event with the given tag for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={defaultMeetingModifiable}
                            onValueChange={changeDefaultMeetingModifiable}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box  style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">By default lock (make static) any new events that are classified as &apos;external meeting type&apos; event with the given tag for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={defaultExternalMeetingModifiable}
                            onValueChange={changeDefaultExternalMeetingModifiable}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
            </div>
        </Box>
    )
}

export default EditCategoryStep6
