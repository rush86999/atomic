import { dayjs, RNLocalize } from '@app/date-utils'
import isBetween from 'dayjs/plugin/isBetween'


export function nearestMinutes(interval: number, someDay: any): string {
  const roundedMinutes =
    Math.round(someDay.clone().minute() / interval) * interval
  return someDay.clone().minute(roundedMinutes).second(0)
}

export const formatTimer = (numberOfSeconds: number): string => {
  const hours = Math.floor(numberOfSeconds / 3600)
  const minutes = Math.floor((numberOfSeconds - hours * 3600) / 60)
  const seconds = numberOfSeconds - hours * 3600 - minutes * 60

  let timerHours = String(hours)
  let timerMinutes = String(minutes)
  let timerSeconds = String(seconds)

  if (hours < 10) {
    timerHours = `0${hours}`
  }
  if (minutes < 10) {
    timerMinutes = `0${minutes}`
  }
  if (seconds < 10) {
    timerSeconds = `0${seconds}`
  }

  if (hours > 0) {
    return `${timerHours}:${timerMinutes}:${timerSeconds}`
  }
  return `${timerMinutes}:${timerSeconds}`
}

export function sameDay(
  as1: string | undefined,
  as2: string | undefined
): boolean {
  const s1 = dayjs(as1)
  const s2 = dayjs(as2)
  return s1.isSame(s2, 'day')
}
