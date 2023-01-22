import React, {useCallback, useMemo} from 'react'
import {TextStyle, ViewStyle, Pressable} from 'react-native'
import XDate from 'xdate'
import dayjs from 'dayjs'

import Box from '@components/common/Box';
import Text from '@components/common/Text';


export interface Event {
    id?: string
    start: string
    end: string
    title: string
    summary?: string
    color?: string
    tags: { id: string, name: string, color: string }[],
    unlink: boolean,
    modifiable: boolean,
    priority: number,
}

export interface PackedEvent extends Event {
  index: number
  left: number
  top: number
  width: number
  height: number
}

export interface EventBlockProps {
  index: number
  event: PackedEvent
  onPress: (eventIndex: number) => void
  renderEvent?: (event: PackedEvent) => JSX.Element
  format24h?: boolean
  styles: { [key: string]: ViewStyle | TextStyle }
}

const TEXT_LINE_HEIGHT = 17

const EventBlock: any = (props: EventBlockProps) => {
  const {
    index,
    event,
    renderEvent,
    onPress,
    format24h,
    styles,
  } = props

  const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT)
  const formatTimeStart = format24h ? 'HH:mm' : dayjs(event?.start).hour() >= 12 ? 'hh(:mm) P' : 'hh(:mm) A'
  const formatTimeEnd = format24h ? 'HH:mm' : dayjs(event?.end).hour() >= 12 ? 'hh(:mm) P' : 'hh(:mm) A'
  const eventStyle = useMemo(() => {
    return {
      left: event.left,
      height: event.height,
      width: event.width,
      top: event.top,
      backgroundColor: event.color ? event.color : '#add8e6'
    }
  }, [event])

  const _onPress = useCallback(() => {
    onPress(index)
  }, [index, onPress])

  return (
    <Pressable hitSlop={10} onPress={_onPress}>
      <Box style={[styles.event, eventStyle]}>
        {renderEvent ? (
          renderEvent(event)
        ) : (
          <Box>
            <Text variant="cardTitle" numberOfLines={1} style={styles.eventTitle}>
              {event.title || 'Event'}
            </Text>
            {numberOfLines > 1 ? (
              <Text variant="body" numberOfLines={numberOfLines - 1} style={[styles.eventSummary]}>
                {event.summary || ' '}
              </Text>
            ) : null}
            {numberOfLines > 2 ? (
              <Text variant="body" style={styles.eventTimes} numberOfLines={1}>
                {new XDate(event.start).toString(formatTimeStart)} - {new XDate(event.end).toString(formatTimeEnd)}
              </Text>
            ) : null}
          </Box>
        )}
      </Box>
    </Pressable>
  )
}

export default EventBlock
