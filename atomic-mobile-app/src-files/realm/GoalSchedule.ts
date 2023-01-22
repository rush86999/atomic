

type GoalType = {
  id: string,
}

type EventType = {
  id: string,
  calendarId: string,
  title?: string,
  startDate?: Date,
  endDate: Date,
  recurringFutureEvents: boolean,
  recurringStartDate?: Date,
  recurringEndDate?: Date,
}

type ReminderType = {
  id: string,
  startDate?: Date,
  endDate: Date,
  recurringFutureEvents: boolean,
  recurringStartDate?: Date,
  recurringEndDate?: Date,
}

class Goal {
  public id: string = ''
  public events: Realm.List<Event> | undefined
  public reminders: Realm.List<Reminder> | undefined

  constructor({
    id = ''
  }: GoalType) {
    this.id = id
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Goal',
    primaryKey: 'id',
    properties: {
      id: 'string',
      events: 'Event[]?',
      reminders: 'Reminder[]?'
    }
  }
}

class Event {
  public id: string = ''
  public calendarId: string
  public title?: string
  public startDate: Date
  public endDate: Date
  public recurringStartDate?: Date
  public recurringEndDate?: Date
  public assignee?: Realm.Results<Goal>

  constructor({
    id = '',
    calendarId = '',
    title,
    startDate = new Date(),
    endDate = new Date(),
    recurringStartDate,
    recurringEndDate,
  }: EventType) {
    this.id = id
    this.calendarId = calendarId
    this.startDate = startDate
    this.endDate = endDate
    this.title = title
    this.recurringStartDate = recurringStartDate
    this.recurringEndDate = recurringEndDate
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Event',
    primaryKey: 'id',
    properties: {
      id: 'string',
      calendarId: 'string',
      title: 'string?',
      startDate: 'date',
      endDate: 'date',
      recurringStartDate: 'date?',
      recurringEndDate: 'date?',
      assignee: {
        type: 'linkingObjects',
        objectType: 'Goal',
        property: 'events'
      }
    }
  }
}

class Reminder {
  public id: string = ''
  public startDate: Date
  public endDate: Date
  public recurringStartDate?: Date
  public recurringEndDate?: Date
  public assignee?: Realm.Results<Goal>

  constructor({
    id = '',
    startDate = new Date(),
    endDate = new Date(),
    recurringStartDate,
    recurringEndDate,
  }: ReminderType) {
    this.id = id
    this.endDate = endDate
    this.startDate = startDate
    this.recurringStartDate = recurringStartDate
    this.recurringEndDate = recurringEndDate
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Reminder',
    primaryKey: 'id',
    properties: {
      id: 'string',
      startDate: 'string',
      endDate: 'date',
      recurringStartDate: 'date?',
      recurringEndDate: 'date?',
      assignee: {
        type: 'linkingObjects',
        objectType: 'Goal',
        property: 'events'
      }
    }
  }
}



export {Event, Reminder, Goal}
