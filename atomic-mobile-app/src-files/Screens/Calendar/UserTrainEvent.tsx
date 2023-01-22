import React, {
    useState,
    useEffect,
    useCallback,
} from 'react'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'


import { EventType, Time } from '@app/dataTypes/EventType'

import { trainEventForPlanning } from '@screens/Calendar/UserTrainCalendarHelper';

import TrainEventBaseStep from '@screens/Calendar/TrainEventWizard/TrainEventBaseStep'
import TrainEventBaseStep2 from '@screens/Calendar/TrainEventWizard/TrainEventBaseStep2'
import TrainEventBaseStep3 from '@screens/Calendar/TrainEventWizard/TrainEventBaseStep3'
import TrainEventBaseStep4 from '@screens/Calendar/TrainEventWizard/TrainEventBaseStep4'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@app/calendar/calendarDbHelper'



type RootStackNavigationParamList = {
 UserTrainEvent: undefined,
 UserViewCalendar: undefined,
}

type UserTrainEventNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserTrainEvent'
    >

type RootStackEventParamList = {
    UserTrainEvent: {
        eventId: string,
    },
}

type UserTrainEventRouteProp = RouteProp<
  RootStackEventParamList,
  'UserTrainEvent'
>

type Props = {
    sub: string,
    route: UserTrainEventRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserTrainEvent(props: Props) {
    const [copyAvailability, setCopyAvailability] = useState<boolean>(false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(false)
    const [copyReminders, setCopyReminders] = useState<boolean>(false)
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(false)
    const [copyModifiable, setCopyModifiable] = useState<boolean>(false)
    const [copyCategories, setCopyCategories] = useState<boolean>(false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(false)
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(false)
    const [copyDuration, setCopyDuration] = useState<boolean>(false)
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()
    const [copyColor, setCopyColor] = useState<boolean>(false)
    

    const navigation = useNavigation<UserTrainEventNavigationProp>()

    const id = props.route?.params?.eventId
    const client = props?.client

    

    useEffect(() => {
        (async () => {
            try {
                if (!id || !client) {
                    return
                }
                const event = await getEventWithId(client, id)
                if (!event) {
                    
                    return
                }
                if (event?.id) {
                    
                    

                    setCopyAvailability(event.copyAvailability)
                    setCopyTimeBlocking(event.copyTimeBlocking)
                    setCopyTimePreference(event.copyTimePreference)
                    setCopyReminders(event.copyReminders)
                    setCopyPriorityLevel(event.copyPriorityLevel)
                    setCopyModifiable(event.copyModifiable)
                    setCopyCategories(event.copyCategories)
                    setCopyIsBreak(event.copyIsBreak)
                    setCopyIsMeeting(event.copyIsMeeting)
                    setCopyIsExternalMeeting(event.copyIsExternalMeeting)
                    setCopyDuration(event.copyDuration)
                    setCopyColor(event.copyColor || false)
                }
            } catch (e) {
                
            }
        })()
    }, [client, id])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    if (!id || !client) {
                        return
                    }
                    const event = await getEventWithId(client, id)
                    if (!event) {
                        
                        return
                    }
                    if (event?.id) {
                        
                        
    
                        setCopyAvailability(event.copyAvailability)
                        setCopyTimeBlocking(event.copyTimeBlocking)
                        setCopyTimePreference(event.copyTimePreference)
                        setCopyReminders(event.copyReminders)
                        setCopyPriorityLevel(event.copyPriorityLevel)
                        setCopyModifiable(event.copyModifiable)
                        setCopyCategories(event.copyCategories)
                        setCopyIsBreak(event.copyIsBreak)
                        setCopyIsMeeting(event.copyIsMeeting)
                        setCopyIsExternalMeeting(event.copyIsExternalMeeting)
                        setCopyDuration(event.copyDuration)
                        setCopyColor(event.copyColor || false)
                    }
                } catch (e) {
                    
                }
            })()
        }, [client, id])
    )

    const trainEvent = async () => {
        try {
            if (!client) {
                return
            }
            await trainEventForPlanning(
                client,
                id,
                copyAvailability,
                copyTimeBlocking,
                copyTimePreference,
                copyReminders,
                copyPriorityLevel,
                copyModifiable,
                copyCategories,
                copyIsBreak,
                copyIsMeeting,
                copyIsExternalMeeting,
                copyDuration,
                copyColor,
            )

            Toast.show({
                text1: 'Event trained',
                type: 'success',
                text2: 'Event trained successfully',
            })

            navigation.navigate('UserViewCalendar')
            
        } catch (e) {
            
        }
    }

    const onActiveIndexChanged = (index: number) => setActiveIndex(index)
    
    const goToPrevStep = () => {
        const prevActiveIndex = activeIndex
        const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
        setActiveIndex(newActiveIndex)
    }
    
    const renderPrevButton = () => {
        if (activeIndex === 0) {
        return <Box mt={{ phone: 's', tablet: 'm' }} />
        }

        return (
            <Box m={{ phone: 's', tablet: 'm' }}>
                <Button onPress={goToPrevStep}>
                    Back
                </Button>
            </Box>
            )
    }
  
    const goToNextStep = () => {
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep

        if (prevActiveIndex === 4) {
            return
        }

        let newActiveIndex = prevActiveIndex + 1

        if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
            const newCompletedStep = prevActiveIndex
            setCompletedStep(newCompletedStep)
        }

        if (newActiveIndex !== prevActiveIndex) {
            setActiveIndex(newActiveIndex)
        }
    }

    const renderNextButton = () => {
        if (activeIndex === 4) {
        return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }

        return (
        <Box m={{ phone: 's', tablet: 'm' }}>
            <Button onPress={goToNextStep}>
                Next
            </Button>
        </Box>
        )
    }

    const getStepState = (index: number) => {
    let state = Wizard.States.DISABLED
    if (completedStep && (completedStep >= index)) {
      state = Wizard.States.COMPLETED;
    } else if (activeIndex === index || (completedStep && (completedStep < index))
              || (completedStep === undefined)) {
        state = Wizard.States.ENABLED;
    }

    return state
    }
    
    const renderCurrentStep = () => {
       
        switch (activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <TrainEventBaseStep
                            copyAvailability={copyAvailability}
                            copyTimeBlocking={copyTimeBlocking}
                            copyTimePreference={copyTimePreference}
                            setParentCopyAvailability={setCopyAvailability}
                            setParentCopyTimeBlocking={setCopyTimeBlocking}
                            setParentCopyTimePreference={setCopyTimePreference}
                        />
                        <Box style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Box />
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 1:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <TrainEventBaseStep2    
                            copyModifiable={copyModifiable}
                            copyCategories={copyCategories}
                            copyIsBreak={copyIsBreak}
                            setParentCopyModifiable={setCopyModifiable}
                            setParentCopyCategories={setCopyCategories}
                            setParentCopyIsBreak={setCopyIsBreak}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <TrainEventBaseStep3
                            copyIsMeeting={copyIsMeeting}
                            copyIsExternalMeeting={copyIsExternalMeeting}
                            copyDuration={copyDuration}
                            setParentCopyIsMeeting={setCopyIsMeeting}
                            setParentCopyIsExternalMeeting={setCopyIsExternalMeeting}
                            setParentCopyDuration={setCopyDuration}
                            copyColor={copyColor}
                            setParentCopyColor={setCopyColor}
                        />
                        <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
            return (
                <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                    <TrainEventBaseStep4
                        setParentCopyReminders={setCopyReminders}
                        setParentCopyPriorityLevel={setCopyPriorityLevel}  
                        copyReminders={copyReminders}
                        copyPriorityLevel={copyPriorityLevel}
                    />
                    <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                        {renderPrevButton()}
                        {renderNextButton()}
                    </Box>
                </Box>
            )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box flex={1} style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                <Text variant="subheaderNormal">
                                    Train Event
                                </Text>
                            </Box>
                            <Box justifyContent="center" alignItems="center">
                                <Box mt={{ phone: 's', tablet: 'm' }}>
                                    <Button onPress={trainEvent}>
                                        Train
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                        <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
                            {renderPrevButton()}
                        </Box>   
                    </Box>
                )
            default:
                return (
                    <Box justifyContent="center" alignItems="center">
                        <RegularCard>
                        <Text variant="header">
                            Oops... something went wrong
                        </Text>
                        </RegularCard>
                    </Box>
                )
        }       
    }

    return (
        <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
                <Wizard.Step state={getStepState(0)} label={'Step 1'} />
                <Wizard.Step state={getStepState(1)} label={'Step 2'} />
                <Wizard.Step state={getStepState(2)} label={'Step 3'} />
                <Wizard.Step state={getStepState(3)} label={'Step 4'} />
                <Wizard.Step state={getStepState(4)} label={'Train Event'} />
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )
}

export default UserTrainEvent





