
type timer = {
  id: string,
  startTime: string,
  breakEpisode?: number,
  breakTimeDuration?: number,
  numberOfBreakEpisodes?: number,
  isBreak: boolean,
  isPause: boolean,
  workEpisode?: number,
  workTimeDuration?: number,
  numberOfWorkEpisodes?: number,
  activeTime?: number,
  totalActiveTime?: number,
  accumulatedDuration?: number,
  lastActiveTime?: string,
  lastTotalActiveTime?: string,
  stopPressed: boolean,
}

class TaskTimer {
  id: string;
  startTime: string;
  breakEpisode: number | undefined;
  breakTimeDuration: number | undefined;
  numberOfBreakEpisodes: number | undefined;
  isBreak: boolean;
  isPause: boolean;
  workEpisode: number | undefined;
  workTimeDuration: number | undefined;
  numberOfWorkEpisodes: number | undefined;
  accumulatedDuration: number | undefined;
  totalActiveTime: number | undefined;
  activeTime?: number
  lastActiveTime?: string
  lastTotalActiveTime?: string
  stopPressed: boolean

  constructor({
    id = '',
    startTime,
    breakEpisode,
    breakTimeDuration,
    numberOfBreakEpisodes,
    isBreak,
    isPause,
    workEpisode,
    workTimeDuration,
    numberOfWorkEpisodes,
    activeTime,
    totalActiveTime,
    accumulatedDuration,
    lastActiveTime,
    lastTotalActiveTime,
    stopPressed,
  }: timer) {
    this.id = id
    this.startTime = startTime
    this.breakEpisode = breakEpisode
    this.breakTimeDuration = breakTimeDuration
    this.numberOfBreakEpisodes = numberOfBreakEpisodes
    this.isBreak = isBreak
    this.isPause = isPause
    this.workEpisode = workEpisode
    this.workTimeDuration = workTimeDuration
    this.numberOfWorkEpisodes = numberOfWorkEpisodes
    this.activeTime = activeTime
    this.totalActiveTime = totalActiveTime
    this.accumulatedDuration = accumulatedDuration
    this.lastActiveTime = lastActiveTime
    this.lastTotalActiveTime = lastTotalActiveTime
    this.stopPressed = stopPressed
  }

  static schema = {
    name: 'TaskTimer',
    properties: {
      id: 'string',
      startTime: 'string',
      breakEpisode: 'int?',
      breakTimeDuration: 'int?',
      numberOfBreakEpisodes: 'int?',
      isBreak: 'bool',
      isPause: 'bool',
      workEpisode: 'int?',
      workTimeDuration: 'int?',
      numberOfWorkEpisodes: 'int?',
      activeTime: 'int?',
      totalActiveTime: 'int?',
      accumulatedDuration: 'int?',
      lastActiveTime: 'string?',
      lastTotalActiveTime: 'string?',
      stopPressed: 'bool'
    },
    primaryKey: 'id',
  };
}

export {TaskTimer};
