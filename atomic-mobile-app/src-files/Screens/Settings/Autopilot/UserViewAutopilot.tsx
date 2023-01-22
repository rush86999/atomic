import React, {
    useState,
    useEffect,
} from 'react'

import { Colors, Switch, Hint } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'
import { StackNavigationProp } from '@react-navigation/stack'
import { RouteProp } from '@react-navigation/native'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { dayjs, RNLocalize } from '@app/date-utils'
import { deleteAutopilotsGivenUserId, deleteScheduledEvent, listAutopilotsByUserId, triggerAddDailyFeaturesApplyUrl } from '@screens/Settings/Autopilot/AutopilotHelper'
import { AutopilotType, ScheduleAssistWithMeetingQueueBodyType } from '@dataTypes/AutopilotType'
import { v4 as uuid } from 'uuid'
import Toast from 'react-native-toast-message'

import { Overlay } from 'react-native-elements/src'
import { Appearance, Pressable } from 'react-native'
import Button from '@components/Button'



type RootStackEventParamList = {
    UserViewAutopilot: undefined,
}

type UserViewAutopilotRouteProp = RouteProp<
  RootStackEventParamList,
  'UserViewAutopilot'
>



type Props = {
    sub: string,
    route: UserViewAutopilotRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

const dark = Appearance.getColorScheme() === 'dark'

function UserViewAutopilot(props: Props) {
    const [isAutopilot, setIsAutopilot] = useState<boolean>(false)
    const [isConfirmAutopilot, setIsConfirmAutopilot] = useState<boolean>(false)
    const [isCancelAutopilot, setIsCancelAutopilot] = useState<boolean>(false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)

    const userId = props?.sub
    const client = props?.client

    

    useEffect(() => {
        (async () => {
            try {
                const autopilots = await listAutopilotsByUserId(client, userId)
                if (autopilots?.length > 0) {
                    setIsAutopilot(true)
                }
            } catch (e) {
                
            }
        })()
    }, [])

    const activateAutopilot = async () => {
        try {
            const startDate = dayjs().add(1, 'd').format()
            

            const scheduleAt = dayjs(startDate).format()
            const timezone = RNLocalize.getTimeZone()

            const bodyFeaturesApply: ScheduleAssistWithMeetingQueueBodyType = {
                userId,
                windowStartDate: startDate,
                windowEndDate: dayjs(startDate).add(6, 'd').format(),
                timezone,
            }

            const autopilotFeaturesApply: AutopilotType = {
                id: uuid(),
                userId,
                scheduleAt,
                timezone,
                payload: bodyFeaturesApply,
                updatedAt: dayjs().format(),
                createdDate: dayjs().format(),
            }

            await triggerAddDailyFeaturesApplyUrl(
                autopilotFeaturesApply,
                bodyFeaturesApply,
            )

        } catch (e) {
            
        }
    }

    const deactivateAutopilot = async () => {
        try {
            const autopilots = await listAutopilotsByUserId(client, userId)
            
            
            
            for (const autopilot of autopilots) {
                await deleteScheduledEvent(autopilot?.id)
            }

            await deleteAutopilotsGivenUserId(client, userId)


        } catch (e) {
            
        }
    }

    const showConfirm = () => setIsConfirmAutopilot(true)

    const hideConfirm = () => {
        setIsConfirmAutopilot(false)
        
    }

    const showCancel = () => setIsCancelAutopilot(true)

    function hideCancel() {
        setIsCancelAutopilot(false)

    }

    const enableAutopilot = async () => {
        try {


            await activateAutopilot()

            hideConfirm()

            Toast.show({
                type: 'success',
                text1: 'Activated Autopilot',
                text2: 'You have successfully activated autopilot. It will start running tomorrow in AM.'
            })

        } catch (e) {
            
            hideConfirm()
            setIsAutopilot(false)
            Toast.show({
                type: 'error',
                text1: 'Oops...',
                text2: 'Something went wrong. Please let us know so we can look under the hood.'
            })
        }
    }

    const disableAutopilot = async () => {
        try {
            await deactivateAutopilot()

            hideCancel()

            setIsAutopilot(false)

            Toast.show({
                type: 'info',
                text1: 'Deactivated Autopilot',
                text2: 'You have deactivated Autopilot. Your calendar will no longer be managed automagically'
            })
        } catch (e) {
            
            hideCancel()
            Toast.show({
                type: 'error',
                text1: 'Oops...',
                text2: 'Something went wrong. Please let us know so we can look under the hood.'
            })
        }
    }

    const onChangeAutopilot = (value: boolean) => {
        if (value) {
            setIsAutopilot(value)
            showConfirm()  
        } else {
            setIsAutopilot(value)
            showCancel()
        }
    }

    return (
        <Box flex={1} justifyContent="flex-start" alignItems="center"  style={{ width: '100%'}}>
            <Box flex={1} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" style={{ width: '80%' }}>
                    <Hint visible={isMessage1} message={'Autopilot will apply features & run planner once every day before work start time'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>
                            <Box flexDirection="row" justifyContent="flex-start">
                            {
                                isAutopilot
                                ? (
                                    <Text variant="buttonLink" mt={{ phone: 's', tablet: 'm' }}>
                                        Autopilot Active
                                    </Text>
                                ) : (
                                    <Text variant="buttonLink" mt={{ phone: 's', tablet: 'm' }}>
                                        Autopilot Inactive
                                    </Text>
                                )
                            }
                            </Box>
                        </Pressable>
                    </Hint>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isAutopilot}
                        onValueChange={onChangeAutopilot}
                        style={{marginBottom: 20}}
                    />
                    </Box>
                </Box>
            </Box>
            <Box>
                <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isConfirmAutopilot} onBackdropPress={hideConfirm}>
                    <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: dark ? palette.black : palette.white}}>
                        <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            <Text variant="optionHeader">
                                Do you want to activate Autopilot?
                            </Text>
                        </Box>
                        <Box justifyContent="center" alignItems="center">
                            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Button onPress={enableAutopilot}>
                                    Okay
                                </Button>  
                            </Box>
                            <Button disabled onPress={hideConfirm}>
                                Cancel
                            </Button>  
                        </Box>
                    </Box>
                </Overlay>
                <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isCancelAutopilot} onBackdropPress={hideCancel}>
                    <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: dark ? palette.black : palette.white}}>
                        <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            <Text variant="optionHeader">
                                Do you want to disable Autopilot?
                            </Text>
                        </Box>
                        <Box justifyContent="center" alignItems="center">
                            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Button onPress={disableAutopilot}>
                                    Okay
                                </Button>  
                            </Box>
                            <Button disabled onPress={hideCancel}>
                                Cancel
                            </Button>  
                        </Box>
                    </Box>
                </Overlay>
            </Box>
        </Box>
    )

}

export default UserViewAutopilot
