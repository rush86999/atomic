/* eslint-disable react/self-closing-comp */
import React, { useState } from "react";
import cls from 'classnames'
import {ButtonScrollToBottom} from '@components/chat/button-scroll-to-bottom'
import {Textarea} from '@components/chat/ui/textarea'
import { Tooltip, TooltipContent,
    TooltipTrigger } from "@components/chat/ui/tooltip";
import { cn } from "@lib/Chat/utils";
import { buttonVariants, Button } from "@components/chat/ui/button";
import { IconPlus, IconArrowElbow } from '@components/chat/ui/icons'
import { useEnterSubmit } from '@lib/Chat/hooks/use-enter-submit'


type Props = {
    sendMessage: (text: string) => void,
    isNewSession: boolean,
    callNewSession: () => void
}

 const ChatInput = ({ sendMessage, isNewSession, callNewSession }: Props) => {
    const [text, setText] = useState<string>('')

    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, [])
    
    const onChangeText = (e: { currentTarget: { value: React.SetStateAction<string>; }; }) => (setText(e.currentTarget.value))

    const onSubmit = (e: { preventDefault: () => void; }) => {
        e?.preventDefault()
        // validate
        if (!text) {
            return
        }
        sendMessage(text)
        setText('')
    }

    

    return (
        <div className={cls('fixed md:w-1/2 bottom-0 ')}>
            
            <form onSubmit={onSubmit}  ref={formRef} className={cls({ 'opacity-50': isNewSession }, 'space-y-4 border-t px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4 bg-white')}>
                <label htmlFor="chat" className={cls("sr-only")}>Your message</label>
                <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden px-8 sm:rounded-md sm:border sm:px-12">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                            onClick={e => {
                                e.preventDefault()
                                callNewSession()
                            }}
                            className={cn(
                                buttonVariants({ size: 'sm', variant: 'outline' }),
                                'absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4'
                            )}
                            >
                            <IconPlus />
                            <span className="sr-only">New Chat</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>New Chat</TooltipContent>
                    </Tooltip>
                    <div className={cls("flex items-center px-3 py-2")}>
                        <Textarea 
                            id="chat2" 
                            ref={inputRef}
                            tabIndex={0}
                            onKeyDown={onKeyDown}
                            spellCheck={false}
                            rows={1} 
                            className={cls("min-h-[60px] w-full focus-within:outline-none sm:text-sm focus:ring-0 focus:ring-offset-0 border-none resize-none")} 
                            placeholder="Your message..."
                            value={text}
                            onChange={onChangeText}
                        />
                        <div className="absolute right-0 top-4 sm:right-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" disabled={isNewSession} type="submit" className={cls("text-white")}>
                                        <IconArrowElbow />
                                        <span className="sr-only">Send message</span>
                                    </Button>
                                </TooltipTrigger>
                            <TooltipContent>Send message</TooltipContent>
                        </Tooltip>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )

}

export default ChatInput
