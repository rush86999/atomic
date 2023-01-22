
type timer = {
  id: string,
  primaryGoalType: string,
  secondaryGoalType: string,
  startTime: string,
  breakEpisode?: number,
  breakStartTime?: string,
  breakTimeDuration?: number,
  numberOfBreakEpisodes?: number,
  isBreak: boolean,
  isPause: boolean,
  workEpisode?: number,
  workStartTime?: string,
  workTimeDuration?: number,
  numberOfWorkEpisodes?: number,
  activeTime?: number,
  totalActiveTime?: number,
  accumulatedDuration?: number,
  lastActiveTime?: string,
  lastTotalActiveTime?: string,
}


class BackgroundTimer {
  id: string;
  secondaryGoalType: string;
  primaryGoalType: string;
  startTime: string;
  breakEpisode: number | undefined;
  breakStartTime: string | undefined;
  breakTimeDuration: number | undefined;
  numberOfBreakEpisodes: number | undefined;
  isBreak: boolean;
  isPause: boolean;
  workEpisode: number | undefined;
  workStartTime: string | undefined;
  workTimeDuration: number | undefined;
  numberOfWorkEpisodes: number | undefined;
  accumulatedDuration: number | undefined;
  totalActiveTime: number | undefined;
  activeTime?: number
  lastActiveTime?: string
  lastTotalActiveTime?: string

  constructor({
    id = '',
    primaryGoalType,
    secondaryGoalType,
    startTime,
    breakEpisode,
    breakStartTime,
    breakTimeDuration,
    numberOfBreakEpisodes,
    isBreak,
    isPause,
    workEpisode,
    workStartTime,
    workTimeDuration,
    numberOfWorkEpisodes,
    activeTime,
    totalActiveTime,
    accumulatedDuration,
    lastActiveTime,
    lastTotalActiveTime,
  }: timer) {
    this.id = id
    this.primaryGoalType = primaryGoalType
    this.secondaryGoalType = secondaryGoalType
    this.startTime = startTime
    this.breakEpisode = breakEpisode
    this.breakStartTime = breakStartTime
    this.breakTimeDuration = breakTimeDuration
    this.numberOfBreakEpisodes = numberOfBreakEpisodes
    this.isBreak = isBreak
    this.isPause = isPause
    this.workEpisode = workEpisode
    this.workStartTime = workStartTime
    this.workTimeDuration = workTimeDuration
    this.numberOfWorkEpisodes = numberOfWorkEpisodes
    this.activeTime = activeTime
    this.totalActiveTime = totalActiveTime
    this.accumulatedDuration = accumulatedDuration
    this.lastActiveTime = lastActiveTime
    this.lastTotalActiveTime = lastTotalActiveTime
  }

  static schema = {
    name: 'BackgroundTimer',
    properties: {
      id: 'string',
      primaryGoalType: 'string',
      secondaryGoalType: 'string',
      startTime: 'string',
      breakEpisode: 'int?',
      breakStartTime: 'string?',
      breakTimeDuration: 'int?',
      numberOfBreakEpisodes: 'int?',
      isBreak: 'bool',
      isPause: 'bool',
      workEpisode: 'int?',
      workStartTime: 'string?',
      workTimeDuration: 'int?',
      numberOfWorkEpisodes: 'int?',
      activeTime: 'int?',
      totalActiveTime: 'int?',
      accumulatedDuration: 'int?',
      lastActiveTime: 'string?',
      lastTotalActiveTime: 'string?'
    },
    primaryKey: 'id',
  };
}

export {BackgroundTimer}
