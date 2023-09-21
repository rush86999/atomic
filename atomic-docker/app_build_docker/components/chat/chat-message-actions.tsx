'use client'


import { Button } from '@components/chat/ui/button'
import { IconCheck, IconCopy } from '@components/chat/ui/icons'
import { useCopyToClipboard } from '@lib/Chat/hooks/use-copy-to-clipboard'
import { cn } from '@lib/Chat/utils'
import { UserChatType } from '@lib/dataTypes/Messaging/MessagingTypes'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: UserChatType
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 20000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end transition-opacity group-hover/item:opacity-100 md:absolute md:-right-10 md:-top-2 md:opacity-0',
        className,
        'text-black'
      )}
      {...props}
    >
      <Button variant="ghost" size="icon" onClick={onCopy}>
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}