import React, {
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react'

import { Wizard, Colors } from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import Toast from 'react-native-toast-message'

import { v4 as uuid } from 'uuid'


import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { DefaultTimeBlockingType, DefaultTimePreferenceTypes } from '@app/dataTypes/CategoryType'
import { DefaultRemindersType } from '@app/dataTypes/CategoryType'
import _ from 'lodash'

import EditCategoryStep1 from '@screens/Settings/EditCategoryWizard/EditCategoryStep1'
import EditCategoryStep1a from '@screens/Settings/EditCategoryWizard/EditCategoryStep1a'
import EditCategoryStep1b from '@screens/Settings/EditCategoryWizard/EditCategoryStep1b'
import EditCategoryStep2 from '@screens/Settings/EditCategoryWizard/EditCategoryStep2'
import EditCategoryStep3 from '@screens/Settings/EditCategoryWizard/EditCategoryStep3'
import EditCategoryStep4 from '@screens/Settings/EditCategoryWizard/EditCategoryStep4'
import EditCategoryStep5 from '@screens/Settings/EditCategoryWizard/EditCategoryStep5'
import EditCategoryStep5a from '@screens/Settings/EditCategoryWizard/EditCategoryStep5a'
import EditCategoryStep6 from '@screens/Settings/EditCategoryWizard/EditCategoryStep6'
import RegularCard from '@components/RegularCard'
import { getCategoryWithId } from '@screens/Category/CategoryHelper'
import { updateCategoryHelper } from '../Category/CategoryHelper';

type RootRouteStackParamList = {
  UserEditCategory: {
    categoryId: string,
  },
}

type UserEditCategoryRouteProp = RouteProp<
  RootRouteStackParamList,
    'UserEditCategory'
>

type RootNavigationStackParamList = {
    UserEditCategories: {
        isUpdate?: string,
    },
    UserEditCategory: undefined,
}

type UserEditCategoryNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserEditCategory'
>

type Props = {
    sub: string,
    route: UserEditCategoryRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

const INITIAL_COLOR = Colors.blue30

function UserEditCategory(props: Props) {
    const [copyAvailability, setCopyAvailability] = useState<boolean>(false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(false)
    const [copyReminders, setCopyReminders] = useState<boolean>(false)
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(false)
    const [copyModifiable, setCopyModifiable] = useState<boolean>(false)
    const [defaultAvailability, setDefaultAvailability] = useState<boolean>(false)
    const [defaultTimeBlocking, setDefaultTimeBlocking] = useState<DefaultTimeBlockingType>()
    const [defaultTimePreference, setDefaultTimePreference] = useState<DefaultTimePreferenceTypes>()
    const [defaultReminders, setDefaultReminders] = useState<number[]>()
    const [defaultPriorityLevel, setDefaultPriorityLevel] = useState<number>()
    const [defaultModifiable, setDefaultModifiable] = useState<boolean>(false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(false)
    const [defaultIsBreak, setDefaultIsBreak] = useState<boolean>(false)
    const [color, setColor] = useState<string>(INITIAL_COLOR)
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(false)
    const [defaultIsMeeting, setDefaultIsMeeting] = useState<boolean>(false)
    const [defaultIsExternalMeeting, setDefaultIsExternalMeeting] = useState<boolean>(false)
    const [defaultMeetingModifiable, setDefaultMeetingModifiable] = useState<boolean>(false)
    const [defaultExternalMeetingModifiable, setDefaultExternalMeetingModifiable] = useState<boolean>(false)

    const [name, setName] = useState<string>('')
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()

    const client = props?.client
    const categoryId = props.route?.params?.categoryId
    
    useEffect(() => {
        if (categoryId) {
            (async () => {
                const category = await getCategoryWithId(client, categoryId)
                
                if (category) {
                    setName(category.name)
                    setColor(category.color)
                    setCopyAvailability(category.copyAvailability)
                    setCopyTimeBlocking(category.copyTimeBlocking)
                    setCopyTimePreference(category.copyTimePreference)
                    setCopyReminders(category.copyReminders)
                    setCopyPriorityLevel(category.copyPriorityLevel)
                    setCopyModifiable(category.copyModifiable)
                    setDefaultAvailability(category.defaultAvailability)
                    setDefaultTimeBlocking(category.defaultTimeBlocking)
                    setDefaultTimePreference(category.defaultTimePreference)
                    setDefaultReminders(category.defaultReminders)
                    setDefaultPriorityLevel(category.defaultPriorityLevel)
                    setDefaultModifiable(category.defaultModifiable)
                    setCopyIsBreak(category.copyIsBreak)
                    setDefaultIsBreak(category.defaultIsBreak)
                    setCopyIsMeeting(category.copyIsMeeting)
                    setCopyIsExternalMeeting(category.copyIsExternalMeeting)
                    setDefaultIsMeeting(category.defaultIsMeeting)
                    setDefaultIsExternalMeeting(category.defaultIsExternalMeeting)
                    setDefaultMeetingModifiable(category.defaultMeetingModifiable)
                    setDefaultExternalMeetingModifiable(category.defaultExternalMeetingModifiable)
                }
            })()
        }
    }, [categoryId])
    

    const navigation = useNavigation<UserEditCategoryNavigationProp>()

    const updateCategory = async () => {
        try {
            if (!categoryId || !client) {
                return
            }
            const existingCategory = await getCategoryWithId(client, categoryId)
            if (!existingCategory) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Error updating tag',
                    position: 'top',
                })
                return
            }
            
            const result = await updateCategoryHelper(
                client, 
                categoryId,
                name,
                copyAvailability,
                copyTimeBlocking,
                copyTimePreference,
                copyReminders,
                copyPriorityLevel,
                copyModifiable,
                defaultAvailability,
                defaultTimeBlocking,
                defaultTimePreference,
                defaultReminders,
                defaultPriorityLevel,
                defaultModifiable,
                copyIsBreak,
                defaultIsBreak,
                color,
                copyIsMeeting,
                copyIsExternalMeeting,
                defaultIsMeeting,
                defaultIsExternalMeeting,
                defaultMeetingModifiable,
                defaultExternalMeetingModifiable,
            )

            
            Toast.show({
                text1: 'Tag updated',
                text2: `${name} updated successfully`,
                type: 'success',
            })
            navigation.navigate('UserEditCategories', { isUpdate: uuid() })
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Error updating tag',
                position: 'top',
            })
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
            <Box ml={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
                <Button onPress={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = () => {
        
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep

        if (prevActiveIndex === 9) {
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
        if (activeIndex === 8) {
            return <Box mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} />
        }

        return (
            <Box mr={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
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
                        <EditCategoryStep1
                            name={name}
                            setParentName={setName}
                            copyAvailability={copyAvailability}
                            setParentCopyAvailability={setCopyAvailability}
                            copyTimeBlocking={copyTimeBlocking}
                            setParentCopyTimeBlocking={setCopyTimeBlocking}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                                <Box />
                                {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 1:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep1a
                            copyTimePreference={copyTimePreference}
                            setParentCopyTimePreference={setCopyTimePreference}
                            copyReminders={copyReminders}
                            setParentCopyReminders={setCopyReminders}
                            copyPriorityLevel={copyPriorityLevel}
                            setParentCopyPriorityLevel={setCopyPriorityLevel}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>

                )
            case 2: 
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep1b
                            copyModifiable={copyModifiable}
                            setParentCopyModifiable={setCopyModifiable}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep2
                            defaultAvailability={defaultAvailability}
                            setParentDefaultAvailability={setDefaultAvailability}
                            defaultTimeBlocking={defaultTimeBlocking}
                            setParentDefaultTimeBlocking={setDefaultTimeBlocking}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep3
                            defaultPriorityLevel={defaultPriorityLevel}
                            setParentDefaultPriorityLevel={setDefaultPriorityLevel}
                            defaultModifiable={defaultModifiable}
                            setParentDefaultModifiable={setDefaultModifiable}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep4
                            defaultTimePreferences={defaultTimePreference}
                            setParentDefaultTimePreference={setDefaultTimePreference}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 6:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep5
                            defaultReminders={defaultReminders as DefaultRemindersType}
                            setParentDefaultReminders={setDefaultReminders as Dispatch<SetStateAction<DefaultRemindersType>>}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box> 
                )
            case 7: 
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep5a
                            copyIsBreak={copyIsBreak}
                            setParentCopyIsBreak={setCopyIsBreak}
                            defaultIsBreak={defaultIsBreak}
                            setParentDefaultIsBreak={setDefaultIsBreak}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 7:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep6
                            color={color}
                            setParentColor={setColor}
                            copyIsMeeting={copyIsMeeting}
                            setParentCopyIsMeeting={setCopyIsMeeting}
                            copyIsExternalMeeting={copyIsExternalMeeting}
                            setParentCopyIsExternalMeeting={setCopyIsExternalMeeting}
                            defaultIsMeeting={defaultIsMeeting}
                            setParentDefaultIsMeeting={setDefaultIsMeeting}
                            defaultIsExternalMeeting={defaultIsExternalMeeting}
                            setParentDefaultIsExternalMeeting={setDefaultIsExternalMeeting}
                            defaultMeetingModifiable={defaultMeetingModifiable}
                            setParentDefaultMeetingModifiable={setDefaultMeetingModifiable}
                            defaultExternalMeetingModifiable={defaultExternalMeetingModifiable}
                            setParentDefaultExternalMeetingModifiable={setDefaultExternalMeetingModifiable}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 8:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                            <Box style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text variant="subheaderNormal">
                                    {name}
                                </Text>
                            </Box>
                            <Box justifyContent="center" alignItems="center">
                                <Box mt={{ phone: 's', tablet: 'm' }}>
                                    <Button onPress={updateCategory}>
                                        Update
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                        <Box flexDirection="row" justifyContent="flex-start" width="100%">
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
                <Wizard.Step state={getStepState(4)} label={'Step 5'} />
                <Wizard.Step state={getStepState(5)} label={'Step 6'} />
                <Wizard.Step state={getStepState(6)} label={'Step 7'} />
                <Wizard.Step state={getStepState(7)} label={'Step 8'} />
                <Wizard.Step state={getStepState(8)} label={name} />
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )
}

export default UserEditCategory
