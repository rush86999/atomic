import React, { useEffect, useState, useCallback, useRef } from 'react'
import { BlurView } from '@react-native-community/blur'
import {
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
    GestureResponderEvent,
    PanResponderGestureState,
    useColorScheme,
    Modal,
    Pressable,
    Appearance,
} from 'react-native'
import { TextField } from 'react-native-ui-lib'
import { Picker } from '@react-native-picker/picker'
import { useFocusEffect } from '@react-navigation/native'

import {v4 as uuid} from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

import Text from '@components/common/Text'
import Box from '@components/common/Box'
import { palette } from '@theme/theme'
import Button from '@components/Button'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import { FeedbackType } from '@app/dataTypes/FeedbackType'
import listLatestFeedbacks from '@app/apollo/gql/listLatestFeedbacks'
import upsertFeedbacks from '@app/apollo/gql/upsertFeedbacks'
import updateFeedbackForLastSeen from '@app/apollo/gql/updateFeedbackForLastSeen'
import updateFeedbackForCount from '@app/apollo/gql/updateFeedbackForCount'
import Toast from 'react-native-toast-message';

const dark = Appearance.getColorScheme() === 'dark'

const styles2 = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22
    },
    modalView: {
      margin: 20,
      backgroundColor: dark ? palette.black : "white",
      borderRadius: 20,
      padding: 35,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
  })

const { width, height } = Dimensions.get('screen')

const MODAL_HEIGHT = height * 0.25

const QUESTION1 = [
    {label: 'Very disappointed', value: 'A'},
    {label: 'Somewhat disappointed', value: 'B'},
    {label: 'Not disappointed', value: 'C'},
]

type Props = {
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
}

function FeedbackBottomModal(props: Props) {
    const [isVisible, setIsVisible] = useState<boolean>(false)
    const [activeQuestion, setActiveQuestion] = useState<number>(1)
    const [question1, setQuestion1] = useState<string>('C')
    const [question2, setQuestion2] = useState<string>('')
    const [question3, setQuestion3] = useState<string>('')
    const [question4, setQuestion4] = useState<string>('')
    

    const client = props?.client
    const userId = props?.userId
    const dark = useColorScheme() === 'dark'


    useEffect(() => {
        (async () => {
            if (!userId || !client) {
                return
            }
            const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                query: listLatestFeedbacks,
                variables: {
                    userId,
                },
            }))?.data?.Feedback?.[0]
            
            if (!feedbackDoc) {
                const valuesToUpsert = {
                    id: uuid(),
                    userId,
                    lastSeen: dayjs().toISOString(),
                    question1_A: false,
                    question1_B: false,
                    question1_C: false,
                    updatedAt: dayjs().toISOString(),
                    createdDate: dayjs().toISOString(),
                    deleted: false,
                    count: 0,
                }

                await client.mutate<{ insert_Feedback: { returning: FeedbackType[] } }>({
                    mutation: upsertFeedbacks,
                    variables: {
                        feedbacks: [valuesToUpsert],
                    },
                })
                setIsVisible(false)

                return
            }

        })()
    }, [client, userId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (!userId || !client) {
                    return
                }
                const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                    query: listLatestFeedbacks,
                    variables: {
                        userId,
                    },
                }))?.data?.Feedback?.[0]
                
                if (!feedbackDoc) {
                    const valuesToUpsert = {
                        id: uuid(),
                        userId,
                        lastSeen: dayjs().toISOString(),
                        question1_A: false,
                        question1_B: false,
                        question1_C: false,
                        updatedAt: dayjs().toISOString(),
                        createdDate: dayjs().toISOString(),
                        deleted: false,
                        count: 0,
                    }
    
                    await client.mutate<{ insert_Feedback: { returning: FeedbackType[] } }>({
                        mutation: upsertFeedbacks,
                        variables: {
                            feedbacks: [valuesToUpsert],
                        },
                    })
                    setIsVisible(false)
    
                    return
                }
    
            })()
            }, [client, userId])
    )

    useEffect(() => {
        (async () => {
            try {
                if (!userId || !client || !isVisible) {
                    return
                }
                const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                    query: listLatestFeedbacks,
                    variables: {
                        userId,
                    },
                }))?.data?.Feedback?.[0]

                if (!feedbackDoc) {
                    return
                }

                await client.mutate<{ update_Feedback_by_pk: FeedbackType }>({
                    mutation: updateFeedbackForLastSeen,
                    variables: {
                        id: feedbackDoc.id,
                        lastSeen: dayjs().toISOString(),
                    },
                })

            } catch (e) {
                
            }
        })()
    }, [isVisible, client, userId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    if (!userId || !client || !isVisible) {
                        return
                    }
                    const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                        query: listLatestFeedbacks,
                        variables: {
                            userId,
                        },
                    }))?.data?.Feedback?.[0]
    
                    if (!feedbackDoc) {
                        return
                    }
    
                    await client.mutate<{ update_Feedback_by_pk: FeedbackType }>({
                        mutation: updateFeedbackForLastSeen,
                        variables: {
                            id: feedbackDoc.id,
                            lastSeen: dayjs().toISOString(),
                        },
                    })
    
                } catch (e) {
                    
                }
            })()
            }, [isVisible, client, userId])
    )


    useEffect(() => {
        (async () => {
            if (!userId || !client) {
                return
            }

            const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                query: listLatestFeedbacks,
                variables: {
                    userId,
                },
            }))?.data?.Feedback?.[0]
            
            const lastSeen = feedbackDoc?.lastSeen
            const lastCount = feedbackDoc?.count
            if (dayjs().isAfter(dayjs(lastSeen).add(14, 'day'))) {
                setIsVisible(true)
                return client.mutate<{ update_Feedback_by_pk: FeedbackType }>({
                    mutation: updateFeedbackForCount,
                    variables: {
                        id: feedbackDoc.id,
                        count: lastCount + 1,
                        lastSeen: dayjs().format(),
                    },
                })
            }
        })()
    }, [client, userId, isVisible])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (!userId || !client) {
                    return
                }
    
                const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                    query: listLatestFeedbacks,
                    variables: {
                        userId,
                    },
                }))?.data?.Feedback?.[0]
                
                const lastSeen = feedbackDoc?.lastSeen
                const lastCount = feedbackDoc?.count
                if (dayjs().isAfter(dayjs(lastSeen).add(14, 'day'))) {
                    setIsVisible(true)
                    return client.mutate<{ update_Feedback_by_pk: FeedbackType }>({
                        mutation: updateFeedbackForCount,
                        variables: {
                            id: feedbackDoc.id,
                            count: lastCount + 1,
                            lastSeen: dayjs().format(),
                        },
                    })
                }
            })()
        }, [client, userId, isVisible])
    )

    useEffect(() => {
        (async () => {
            if (!userId || !client) {
                return
            }
            const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                query: listLatestFeedbacks,
                variables: {
                    userId,
                },
            }))?.data?.Feedback?.[0]
            
            if (!feedbackDoc) {
                return
            }

            if (feedbackDoc?.count > 12) {
                setIsVisible(false)
                return
            }

            if (
                (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                && feedbackDoc?.question2 
                && feedbackDoc?.question3 
                && feedbackDoc?.question4
            ) {
                setIsVisible(false)
                return
            }

            if (dayjs().isAfter(dayjs(feedbackDoc?.lastSeen).add(14, 'day'))) {
                setIsVisible(true)
            }
        })()
    }, [client, userId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (!userId || !client) {
                    return
                }
                const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                    query: listLatestFeedbacks,
                    variables: {
                        userId,
                    },
                }))?.data?.Feedback?.[0]
                
                if (!feedbackDoc) {
                    return
                }
    
                if (feedbackDoc?.count > 12) {
                    setIsVisible(false)
                    return
                }
    
                if (
                    (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                    && feedbackDoc?.question2 
                    && feedbackDoc?.question3 
                    && feedbackDoc?.question4
                ) {
                    setIsVisible(false)
                    return
                }
    
                if (dayjs().isAfter(dayjs(feedbackDoc?.lastSeen).add(14, 'day'))) {
                    setIsVisible(true)
                }
            })()
        }, [client, userId])
    )

    useEffect(() => {
        (async () => {
            if (!userId || !client) {
                return
            }
            const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                query: listLatestFeedbacks,
                variables: {
                    userId,
                },
            }))?.data?.Feedback?.[0]

            if (!feedbackDoc) {
                return
            }

            setActiveQuestion(1)

            if (
                (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                && feedbackDoc?.question2
                && feedbackDoc?.question3
                && feedbackDoc?.question4
            ) {
                setActiveQuestion(null)
                return
            }

            if (feedbackDoc.question1_A) {
                setActiveQuestion(2)
                
            }

            if (feedbackDoc.question1_B) {
                setActiveQuestion(2)
                
            }

            if (feedbackDoc.question1_C) {
                setActiveQuestion(2)
                
            }

            if (
                (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                && feedbackDoc.question2
                ) {
                setActiveQuestion(3)
                
            }

            if (
                (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                && feedbackDoc.question2
                &&  feedbackDoc.question3
                ) {
                setActiveQuestion(4)
                
            }

            if (
                (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                && feedbackDoc.question2
                &&  feedbackDoc.question3
                && feedbackDoc.question4
                ) {
                setActiveQuestion(null)
                
            }
        })()
    }, [client, userId])

    useFocusEffect(
        useCallback(
            () => {
                (async () => {
                    if (!userId || !client) {
                        return
                    }
                    const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                        query: listLatestFeedbacks,
                        variables: {
                            userId,
                        },
                    }))?.data?.Feedback?.[0]
        
                    if (!feedbackDoc) {
                        return
                    }
        
                    setActiveQuestion(1)
        
                    if (
                        (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                        && feedbackDoc?.question2
                        && feedbackDoc?.question3
                        && feedbackDoc?.question4
                    ) {
                        setActiveQuestion(null)
                        return
                    }
        
                    if (feedbackDoc.question1_A) {
                        setActiveQuestion(2)
                        
                    }
        
                    if (feedbackDoc.question1_B) {
                        setActiveQuestion(2)
                        
                    }
        
                    if (feedbackDoc.question1_C) {
                        setActiveQuestion(2)
                        
                    }
        
                    if (
                        (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                        && feedbackDoc.question2
                        ) {
                        setActiveQuestion(3)
                        
                    }
        
                    if (
                        (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                        && feedbackDoc.question2
                        &&  feedbackDoc.question3
                        ) {
                        setActiveQuestion(4)
                        
                    }
        
                    if (
                        (feedbackDoc.question1_A || feedbackDoc.question1_B || feedbackDoc.question1_C)
                        && feedbackDoc.question2
                        &&  feedbackDoc.question3
                        && feedbackDoc.question4
                        ) {
                        setActiveQuestion(null)
                        
                    }
                })()
            }, [client, userId]
        )
    )


    const pan = useRef(new Animated.ValueXY({ x: 0, y: height })).current
    const animatedWidth = React.useRef(0)

    const openAnim = () => {
        Animated.spring(pan.y, {
            toValue: height - MODAL_HEIGHT,
            bounciness: 0,
            useNativeDriver: true,
        }).start()
    }

    const closeAnim = () => {
        Animated.spring(pan.y, {
          toValue: height,
          useNativeDriver: true,
        }).start()
    }

    useEffect(() => {
        if (!isVisible) {
          return
        }
        openAnim()
    }, [isVisible])

    useFocusEffect(
        useCallback(() => {
            if (!isVisible) {
              return
            }
            openAnim()
        }, [isVisible])
    )

    const switchRender = () => {
        switch(activeQuestion) {
            case 1: 
                return (
                    <Box
                    
                    >
                    <Box
                        >
                        <Text
                            variant="optionHeader">
                            How would you feel if you could no longer use Atomic?
                        </Text>
    
                        <Box
                            style={{
                            
                            flexDirection: 'row',
                            }}>
                            <Box flex={1} justifyContent="center" alignItems="center">
                                <Picker
                                    selectedValue={question1}
                                    onValueChange={setQuestion1}
                                    style={{ height: 150, width: '100%', color: dark ? palette.white : palette.textBlack }}
                                >
                                    {QUESTION1.map((response) => (   
                                        <Picker.Item color={dark ? palette.white : palette.textBlack} key={response?.value} value={response?.value} label={response?.label} />
                                    ))}
                                </Picker>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                )
            case 2:
                return (
                    <Box
                    
                    >
                    <Box
                        >
                        <Text
                            variant="optionHeader">
                            What type of people do you think would most benefit from Atomic?
                        </Text>
    
                        <Box
                            style={{
                            
                            flexDirection: 'row',
                            }}>
                            <Box flex={1} justifyContent="center" alignItems="center">
                            <TextField
                                onChangeText={setQuestion2}
                                value={question2}
                                multiline
                                style={{ width: '85%' }}
                            />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                )
            case 3:
                return (
                    <Box
                    
                    >
                    <Box
                        >
                        <Text
                            variant="optionHeader">
                            What is the main benefit you receive from Atomic?
                        </Text>
    
                        <Box
                            style={{
                            
                            flexDirection: 'row',
                            }}>
                            <Box flex={1} justifyContent="center" alignItems="center">
                            <TextField
                                onChangeText={setQuestion3}
                                value={question3}
                                multiline
                                style={{ width: '85%' }}
                            />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                )
            case 4:
                return (
                    <Box
                    
                    >
                    <Box
                        >
                        <Text
                            variant="optionHeader">
                            How can we improve Atomic for you?
                        </Text>
    
                        <Box
                            style={{
                            
                            flexDirection: 'row',
                            }}>
                            <Box flex={1} justifyContent="center" alignItems="center">
                            <TextField
                                onChangeText={setQuestion4}
                                value={question4}
                                multiline
                                style={{ width: '85%' }}
                            />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                )
            default:
                return null
        }
    }

    const onSubmit = async () => {
        try {
            if (!userId || !client) {
                return
            }
    
            const feedbackDoc = (await client.query<{ Feedback: FeedbackType[] }>({
                query: listLatestFeedbacks,
                variables: {
                    userId,
                },
            }))?.data?.Feedback?.[0]
            
            if (!feedbackDoc) {
                return
            }

            const updateFeedbackQuestions = gql`
            mutation UpdateFeedbackQuestions(
                $id: uuid!, 
                $lastSeen: timestamptz!, 
                ${question1 !== undefined ? '$question1_A: Boolean,' : ''} 
                ${question1 !== undefined ? '$question1_B: Boolean,' : ''}
                ${question1 !== undefined ? '$question1_C: Boolean,' : ''} 
                ${question2 ? '$question2: String,' : ''} 
                ${question3 ? '$question3: String,' : ''} 
                ${question4 ? '$question4: String,' : ''}
                $updatedAt: timestamptz,
            ) {
                update_Feedback_by_pk(pk_columns: {id: $id}, 
                    _set: {
                        lastSeen: $lastSeen, 
                        ${question1 ? 'question1_A: $question1_A,' : ''} 
                        ${question1 ? 'question1_B: $question1_B,' : ''} 
                        ${question1 ?'question1_C: $question1_C,' : ''} 
                        ${question2 ? 'question2: $question2,' : ''} 
                        ${question3 ? 'question3: $question3,' : ''}
                        ${question4 ? 'question4: $question4,' : ''} 
                        updatedAt: $updatedAt,
                    }) {
                    lastSeen
                    question1_A
                    question1_B
                    question1_C
                    question2
                    question3
                    question4
                    updatedAt
                    userId
                    count
                }
            }
            `
            let variables: any = {
                id: feedbackDoc.id,
                lastSeen: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
            }

            if (question1 === 'A') {
                variables = {
                    ...variables,
                    question1_A: true,
                    question1_B: false,
                    question1_C: false,
                }
            } else if (question1 === 'B') {
                variables = {
                    ...variables,
                    question1_B: true,
                    question1_A: false,
                    question1_C: false,
                }
            } else if (question1 === 'C') {
                variables = {
                    ...variables,
                    question1_C: true,
                    question1_A: false,
                    question1_B: false,
                }
            } 
            
            if (question2) {
                variables = {
                    ...variables,
                    question2,
                }
            } 
            
            if (question3) {
                variables = {
                    ...variables,
                    question3,
                }
            } 
            
            if (question4) {
                variables = {
                    ...variables,
                    question4,
                }
            }

            await client.mutate<{ update_Feedback_by_pk: FeedbackType }>({
                mutation: updateFeedbackQuestions,
                variables,
            })

        } catch (error) {
            
        }
    }

    const onSubmitSwitch = async () => {
        try {
            if (!userId || !client) {
                return
            }

            await onSubmit()
            switch(activeQuestion) {
                case 1:
                    setActiveQuestion(2)
                    break
                case 2:
                    setActiveQuestion(3)
                    break
                case 3:
                    setActiveQuestion(4)
                    break
                case 4:
                    setActiveQuestion(null)
                    Toast.show({
                        type: 'success',
                        text1: 'Thank you for your feedback!',
                        text2: 'We value your input and will try to improve Atomic for you.',
                    })
                    break
                default:
                    setActiveQuestion(null)
                    break
            }
        } catch (error) {
            
        }
    }

    
    

    const hideModal = () => {
        setActiveQuestion(null)
        setIsVisible(false)
    }

    const showModal = () => {
        setIsVisible(true)
    }
    
    
    

    if ((activeQuestion === null) || !userId || !client || !isVisible) {
        return null
    }

    return (
        <Box>
            <Modal animationType="slide" transparent={true} visible={isVisible} onDismiss={hideModal}>
                <Box style={styles2.centeredView}>
                    <Box style={styles2.modalView}>
                        {switchRender()}
                        <Box m={{ phone: 's', tablet: 'm' }}>
                        <Button onPress={onSubmitSwitch}>
                            Submit
                        </Button>
                        </Box>
                        <Box m={{ phone: 's', tablet: 'm' }}>
                            <Pressable onPress={hideModal}>
                                <Text variant="buttonLink">
                                    Cancel
                                </Text>
                            </Pressable>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </Box>
    )
}

export default FeedbackBottomModal