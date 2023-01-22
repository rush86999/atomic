
type timer = {
  id: string,
  startTime: string,
  breakEpisode?: number,
  breakStartTime?: string,
  breakTimeDuration?: number,
  numberOfBreakEpisodes?: number,
  isBreak: boolean,
  isPause: boolean,
  activeTime?: number,
  totalActiveTime?: number,
  accumulatedDuration?: number,
  lastActiveTime?: string,
  lastTotalActiveTime?: string,
  stopPressed: boolean,
}


class ExerciseTimer {
  id: string
  startTime: string
  breakEpisode: number | undefined
  breakTimeDuration: number | undefined
  numberOfBreakEpisodes: number | undefined
  isBreak: boolean
  isPause: boolean
  stopPressed: boolean
  accumulatedDuration: number | undefined
  totalActiveTime: number | undefined
  activeTime?: number
  lastActiveTime?: string
  lastTotalActiveTime?: string

  constructor({
    id = '',
    startTime,
    breakEpisode,
    breakTimeDuration,
    numberOfBreakEpisodes,
    isBreak,
    isPause,
    activeTime,
    totalActiveTime,
    accumulatedDuration,
    lastActiveTime,
    stopPressed,
    lastTotalActiveTime,
  }: timer) {
    this.id = id
    this.startTime = startTime
    this.breakEpisode = breakEpisode
    this.breakTimeDuration = breakTimeDuration
    this.numberOfBreakEpisodes = numberOfBreakEpisodes
    this.isBreak = isBreak
    this.isPause = isPause
    this.activeTime = activeTime
    this.totalActiveTime = totalActiveTime
    this.accumulatedDuration = accumulatedDuration
    this.lastActiveTime = lastActiveTime
    this.stopPressed = stopPressed
    this.lastTotalActiveTime = lastTotalActiveTime
  }

  static schema = {
    name: 'ExerciseTimer',
    properties: {
      id: 'string',
      startTime: 'string',
      breakEpisode: 'int?',
      breakTimeDuration: 'int?',
      numberOfBreakEpisodes: 'int?',
      isBreak: 'bool',
      isPause: 'bool',
      stopPressed: 'bool',
      activeTime: 'int?',
      totalActiveTime: 'int?',
      accumulatedDuration: 'int?',
      lastActiveTime: 'string?',
      lastTotalActiveTime: 'string?'
    },
    primaryKey: 'id',
  }
}

export {ExerciseTimer}
