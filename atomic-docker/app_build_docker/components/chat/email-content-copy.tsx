'use client'


import { Button } from '@components/chat/ui/button'
import { IconCheck, IconCopy } from '@components/chat/ui/icons'
import { useCopyToClipboard } from '@lib/Chat/hooks/use-copy-to-clipboard'
import { cn } from '@lib/Chat/utils'
import { UserChatType } from '@lib/dataTypes/Messaging/MessagingTypes'
import React from 'react'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  emailContent: React.MutableRefObject<HTMLDivElement>
}

export function EmailContentCopy({
  emailContent,
  className,
  ...props
}: ChatMessageActionsProps) {
  // const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 20000 })
  const [isCopied, setIsCopied] = React.useState<Boolean>(false)

  const onCopy = () => {
    if (isCopied) return
    // copyToClipboard(emailContent.innerText)
    navigator.clipboard.write([new ClipboardItem({
      'text/plain': new Blob([emailContent.current.innerText], {type: 'text/plain'}),
      'text/html': new Blob([emailContent.current.innerHTML], {type: 'text/html'})
    })])
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 20000)
    // copyToClipboard(emailContent)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-start opacity-100 ',
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