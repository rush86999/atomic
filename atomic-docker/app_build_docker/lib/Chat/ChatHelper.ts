import { ChatBrainBodyType, ChatHistoryType, SkillChatHistoryType, SkillMessageHistoryType } from "@lib/dataTypes/Messaging/MessagingTypes"
import { dayjs } from "@lib/date-utils"
import _ from "lodash"
import { chatWSAPIUrl } from "./constants"
import qs from 'qs'
import { v4 as uuid } from 'uuid'

export const createChatSocket = async (token: string) => {
    try {
        const socket = new WebSocket(`${chatWSAPIUrl}?${qs.stringify({Auth: `Bearer ${token}`})}`)
        return socket
    } catch (e) {
        console.log(e, ' unable to create client')
    }
}

export const newSession = (
    setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryType | []>>,
    setMessageHistory: React.Dispatch<React.SetStateAction<[] | SkillChatHistoryType>>,
    setReconnect: React.Dispatch<React.SetStateAction<boolean>>,
    reconnect: boolean,
) => {
    setChatHistory([{
        role: 'assistant',
        content: 'How can I help you today?',
        id: 0,
        date: dayjs().format(),
    }])
    setMessageHistory([{
        skill: 'pending',
        query: 'pending',
        messages: [],
    }])
    setReconnect(!reconnect)
}

export const sendMessage = async (
    socket: WebSocket,
    body: ChatBrainBodyType,
) => {
    try {
        socket.send(JSON.stringify(body))
    } catch (e) {
        console.log(e, ' unable to send message')
    }
}

export const addMessageToBrain = async (
    socket: WebSocket,
    userMessage: string,
    userId: string,
    timezone: string,
    chatHistory: ChatHistoryType,
    messageHistory: SkillChatHistoryType,
    setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryType | []>>,
    setMessageHistory: React.Dispatch<React.SetStateAction<[] | SkillChatHistoryType>>,
    setIsLoading:  React.Dispatch<React.SetStateAction<boolean>>,
) => {
    console.log(chatHistory, ' chatHistory inside addNewQuestion')
    const newChatHistory = (chatHistory || [])?.concat([{
        role: 'user',
        content: userMessage,
        id: chatHistory?.length, // old length so matche index
        date: dayjs().format(),
    }])
    try {
        console.log(newChatHistory, ' newChatHistory inside addNewQuestion')
        const newChatHistory2 = (newChatHistory || [])?.concat([{
            role: 'assistant',
            content: 'working ...',
            id: newChatHistory?.length,
            date: dayjs().format(),
        }])

        console.log(newChatHistory2, ' newChatHistory2 inside addNewQuestion')

        setChatHistory(newChatHistory2)

        setIsLoading(true)

        /**{
    skill: SkillType,
    messages: MessageHistoryType,
    query: 'missing_fields' | 'completed' | 'event_not_found' | 'pending' | 'error',
    required?: RequiredFieldsType,
    formData?: ReceiverTimezoneFormDataResponseType,
    prevData?: any,
    prevDataExtra?: any,
}
 */     const index = messageHistory?.length === 0 ? 0 : messageHistory?.length - 1
        const newMessage: SkillMessageHistoryType = {
            ...messageHistory?.[index],
            messages: [
                ...messageHistory?.[index]?.messages,
                {role: 'user', content: userMessage}
            ]
        }
        const body: ChatBrainBodyType = {
            chat: newMessage,
            userId,
            timezone,
            id: uuid(),
        }

        await sendMessage(socket, body)

        const newMessageHistory = messageHistory.concat([newMessage])

        setMessageHistory(newMessageHistory)

    } catch (e) {
        console.log(e, ' unable to add message to brain')
    }
}

export const receiveMessageFromBrain = async (
    skillMessageHistory: SkillMessageHistoryType,
    chatHistory: ChatHistoryType,
    messageHistory: SkillChatHistoryType,
    setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryType | []>>,
    setMessageHistory: React.Dispatch<React.SetStateAction<[] | SkillChatHistoryType>>,
    setIsLoading:  React.Dispatch<React.SetStateAction<boolean>>,
) => {
    try {
        switch(skillMessageHistory.query) {
            case 'missing_fields':
                const reverseMessages = _.cloneDeep(skillMessageHistory?.messages)?.reverse() || []
                const updateAssistantContent = reverseMessages?.find(m => (m?.role === 'assistant'))?.content
                const reverseChatHistory = _.cloneDeep(chatHistory)?.reverse() || []
                const foundChat = reverseChatHistory?.find(c => ((c?.role === 'assistant') && (c?.content === 'working ...')))
                if (foundChat) {
                    foundChat.content = updateAssistantContent
                    for (const chat of chatHistory) {
                        if (chat?.id === foundChat.id) {
                            chat.content = foundChat.content
                            break
                        }
                    }

                    const newChatHistory = _.cloneDeep(chatHistory)
                    const oldMessageHistory_sliced = messageHistory?.slice(0, messageHistory?.length - 1)
                    const newMessageHistory_mf = oldMessageHistory_sliced.concat([skillMessageHistory])
                    setChatHistory(newChatHistory)
                    setMessageHistory(newMessageHistory_mf)

                }
                setIsLoading(false)
                break
            case 'completed':
                const newSkillMessageHistory: SkillMessageHistoryType = {
                    skill: 'pending',
                    query: 'pending',
                    messages: [],
                }
                
                const reverseMessages_c = _.cloneDeep(skillMessageHistory?.messages)?.reverse()
                const updateAssistantContent_c = reverseMessages_c?.find(m => (m?.role === 'assistant'))?.content
                const reverseChatHistory_c = _.cloneDeep(chatHistory)?.reverse()
                console.log(reverseChatHistory_c, ' reverseChatHistory_c')
                const foundChat_c = reverseChatHistory_c?.find(c => ((c?.role === 'assistant') && (c?.content === 'working ...')))
                if (foundChat_c) {
                    foundChat_c.content = updateAssistantContent_c
                    for (const chat of chatHistory) {
                        if (chat?.id === foundChat_c.id) {
                            chat.content = foundChat_c.content
                            break
                        }
                    }

                    const newChatHistory_c = _.cloneDeep(chatHistory)
                    const oldMessageHistory_sliced_c = messageHistory?.slice(0, messageHistory?.length - 1)
                    const newMessageHistory_com = oldMessageHistory_sliced_c
                        .concat([skillMessageHistory])
                        .concat([newSkillMessageHistory])
                    setChatHistory(newChatHistory_c)
                    setMessageHistory(newMessageHistory_com)
                }
                setIsLoading(false)
                break
            case 'event_not_found':
                const newSkillMessageHistory_not_found: SkillMessageHistoryType = {
                    skill: 'pending',
                    query: 'pending',
                    messages: [],
                }
                
                const reverseMessages_not_found = _.cloneDeep(skillMessageHistory?.messages)?.reverse()
                const updateAssistantContent_not_found = reverseMessages_not_found?.find(m => (m?.role === 'assistant'))?.content
                const reverseChatHistory_not_found = _.cloneDeep(chatHistory)?.reverse()
                const foundChat_not_found = reverseChatHistory_not_found?.find(c => ((c?.role === 'assistant') && (c?.content === 'working ...')))

                if (foundChat_not_found) {
                    foundChat_not_found.content = updateAssistantContent_not_found
                    for (const chat of chatHistory) {
                        if (chat?.id === foundChat_not_found.id) {
                            chat.content = foundChat_not_found.content
                            break
                        }
                    }
                    const newChatHistory_not_found = _.cloneDeep(chatHistory)
                    const oldMessageHistory_sliced_not_found = messageHistory?.slice(0, messageHistory?.length - 2)
                    const newMessageHistory_not_found = oldMessageHistory_sliced_not_found
                        .concat([skillMessageHistory])
                        .concat([newSkillMessageHistory_not_found])
                    setChatHistory(newChatHistory_not_found)
                    setMessageHistory(newMessageHistory_not_found)

                }
                
                setIsLoading(false)
                break
           
        }


    } catch (e) {
        console.log(e, ' unabl eto receive message from brain')
        
    }
}

