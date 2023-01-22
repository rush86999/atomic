

type TaskType = {
  id: string,
  events: Event[],
  reminders: Reminder[],
}
type EventType = {
  id: string,
  calendarId: string,
  primaryGoalType: string,
  secondaryGoalType?: string,
  title?: string,
  startDate: Date,
  endDate: Date,
  recurringRandom: boolean,
  rruleEvent: boolean,
  recurringStartDate?: Date,
  recurringEndDate?: Date,
  extractedStartDate?: Date,
  extractedEndDate?: Date,
  notes?: string,
  deadline?: boolean,
  event?: boolean,
}
type ReminderType = {
  id: string,
  calendarId: string,
  startDate: Date,
  endDate: Date,
  recurringRandom: boolean,
  recurringStartDate?: Date,
  recurringEndDate?: Date,
}

class Task {
  public id: string = ''
  public events: Realm.List<Event>
  public reminders: Realm.List<Reminder>

  constructor({
    id = '',
    events = [],
    reminders = [],
  }: TaskType) {
    this.id = id
    this.events = events as any
    this.reminders = reminders as any
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Task',
    primaryKey: 'id',
    properties: {
      id: 'string',
      events: 'Event[]',
      reminders: 'Reminder[]'
    }
  }
}

class Event {
  public id: string = ''
  public calendarId: string
  public primaryGoalType: string
  public secondaryGoalType?: string
  public title?: string
  public startDate: Date
  public endDate: Date
  public recurringRandom: boolean
  public rruleEvent: boolean
  public deadline: boolean
  public event: boolean
  public recurringStartDate?: Date
  public recurringEndDate?: Date
  public extractedStartDate?: Date
  public extractedEndDate?: Date
  public notes?: string
  public assignee: Realm.Results<Task>

  constructor({
    id = '',
    calendarId = '',
    primaryGoalType,
    secondaryGoalType,
    title,
    startDate = new Date(),
    endDate = new Date(),
    recurringRandom = false,
    rruleEvent = false,
    deadline = false,
    event = false,
    recurringStartDate,
    recurringEndDate,
    extractedStartDate,
    extractedEndDate,
    notes,
  }: EventType) {
    this.id = id
    this.calendarId = calendarId
    this.primaryGoalType = primaryGoalType
    this.secondaryGoalType = secondaryGoalType
    this.endDate = endDate
    this.recurringRandom = recurringRandom
    this.rruleEvent = rruleEvent
    this.deadline = deadline
    this.event = event
    this.title = title
    this.startDate = startDate
    this.recurringStartDate = recurringStartDate
    this.recurringEndDate = recurringEndDate
    this.extractedStartDate = extractedStartDate
    this.extractedEndDate = extractedEndDate
    this.notes = notes
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Event',
    primaryKey: 'id',
    properties: {
      id: 'string',
      calendarId: 'string',
      primaryGoalType: 'string',
      secondaryGoalType: 'string?',
      title: 'string?',
      startDate: 'date',
      endDate: 'date',
      recurringRandom: 'bool',
      rruleEvent: 'bool',
      deadline: 'bool',
      event: 'bool',
      recurringStartDate: 'date?',
      recurringEndDate: 'date?',
      extractedStartDate: 'date?',
      extractedEndDate: 'date?',
      notes: 'string?',
      assignee: {
        type: 'linkingObjects',
        objectType: 'Task',
        property: 'events'
      }
    }
  }
}

class Reminder {
  public id: string = ''
  public calendarId: string
  public startDate: Date
  public endDate: Date
  public recurringRandom: boolean
  public recurringStartDate?: Date
  public recurringEndDate?: Date
  public assignee: Realm.Results<Task>

  constructor({
    id = '',
    calendarId = '',
    startDate = new Date(),
    endDate = new Date(),
    recurringRandom = false,
    recurringStartDate,
    recurringEndDate,
  }: ReminderType) {
    this.id = id
    this.calendarId = calendarId
    this.endDate = endDate
    this.startDate = startDate
    this.recurringRandom = recurringRandom
    this.recurringStartDate = recurringStartDate
    this.recurringEndDate = recurringEndDate
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Reminder',
    primaryKey: 'id',
    properties: {
      id: 'string',
      calendarId: 'string',
      startDate: 'string',
      endDate: 'date',
      recurringRandom: 'bool',
      recurringStartDate: 'date?',
      recurringEndDate: 'date?',
      assignee: {
        type: 'linkingObjects',
        objectType: 'Task',
        property: 'reminders'
      }
    }
  }
}

export {Task, Event, Reminder}
