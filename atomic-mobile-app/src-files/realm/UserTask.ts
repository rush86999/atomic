
import { dayjs } from '@app/date-utils'




type DailyToDoType = {
  id: string
  notes: string
  completed?: boolean
  startDate?: string
  endDate?: string
  completedDate?: string
  nextDay?: boolean
  important?: boolean
  date?: string
  event?: boolean
  scheduleId?: string
  deadline?: boolean
  recurring?: boolean
  extractedDate?: boolean
  syncId?: string
  syncName?: string
  status?: string
  parentId?: string
  order?: number
}

type WeeklyToDoType = {
  id: string
  notes: string
  completed?: boolean
  startDate?: string
  endDate?: string
  completedDate?: string
  nextDay?: boolean
  important?: boolean
  date?: string
  event?: boolean
  scheduleId?: string
  deadline?: boolean
  recurring?: boolean
  extractedDate?: boolean
  syncId?: string
  syncName?: string
  status?: string
  parentId?: string
  order?: number
}

type MasterToDoType = {
  id: string
  notes: string
  completed?: boolean
  startDate?: string
  endDate?: string
  completedDate?: string
  nextDay?: boolean
  important?: boolean
  date?: string
  event?: boolean
  scheduleId?: string
  deadline?: boolean
  recurring?: boolean
  extractedDate?: boolean
  syncId?: string
  syncName?: string
  status?: string
  parentId?: string
  order?: number
}

type GroceryToDoType = {
  id: string
  notes: string
  completed?: boolean
  startDate?: string
  endDate?: string
  completedDate?: string
  nextDay?: boolean
  important?: boolean
  date?: string
  event?: boolean
  scheduleId?: string
  deadline?: boolean
  recurring?: boolean
  extractedDate?: boolean
  syncId?: string
  syncName?: string
  status?: string
  parentId?: string
  order?: number
}

class DailyToDo {
  public id: string = ''
  public notes: string = ''
  public completed?: boolean
  public startDate?: string
  public endDate?: string
  public completedDate?: string
  public nextDay?: boolean
  public important?: boolean
  public date?: string
  public event?: boolean
  public scheduleId?: string
  public deadline?: boolean
  public recurring?: boolean
  public extractedDate?: boolean
  public syncId?: string
  public syncName?: string
  public status?: string
  public parentId?: string
  public order?: number

  constructor({
    id = '',
    notes = '',
    completed,
    startDate,
    endDate,
    completedDate,
    nextDay,
    important,
    date = dayjs().format(),
    event,
    scheduleId,
    deadline,
    recurring,
    extractedDate,
    syncId,
    syncName,
    status,
    parentId,
    order,
  }: DailyToDoType) {
    this.id = id
    this.notes = notes
    this.completed = completed
    this.startDate = startDate
    this.endDate = endDate
    this.completedDate = completedDate
    this.nextDay = nextDay
    this.important = important
    this.date = date
    this.event = event
    this.scheduleId = scheduleId
    this.deadline = deadline
    this.recurring = recurring
    this.extractedDate = extractedDate
    this.syncId = syncId
    this.syncName = syncName
    this.status = status
    this.parentId = parentId
    this.order = order
  }

  public static schema: Realm.ObjectSchema = {
    name: 'DailyToDo',
    primaryKey: 'id',
    properties: {
      id: 'string',
      notes: 'string',
      completed: 'bool?',
      startDate: 'string?',
      endDate: 'string?',
      completedDate: 'string?',
      nextDay: 'bool?',
      important: 'bool?',
      date: 'string?',
      event: 'bool?',
      scheduleId: 'string?',
      deadline: 'bool?',
      recurring: 'bool?',
      extractedDate: 'bool?',
      syncId: 'string?',
      syncName: 'string?',
      status: 'string?',
      parentId: 'string?',
      order: 'int?',
    }
  }
}

class WeeklyToDo {
  public id: string = ''
  public notes: string = ''
  public completed?: boolean
  public startDate?: string
  public endDate?: string
  public completedDate?: string
  public nextDay?: boolean
  public important?: boolean
  public date?: string
  public event?: boolean
  public scheduleId?: string
  public deadline?: boolean
  public recurring?: boolean
  public extractedDate?: boolean
  public syncId?: string
  public syncName?: string
  public status?: string
  public parentId?: string
  public order?: number

  constructor({
    id = '',
    notes = '',
    completed,
    startDate,
    endDate,
    completedDate,
    nextDay,
    important,
    date = dayjs().format(),
    event,
    scheduleId,
    deadline,
    recurring,
    extractedDate,
    syncId,
    syncName,
    status,
    parentId,
    order,
  }: WeeklyToDoType) {
    this.id = id
    this.notes = notes
    this.completed = completed
    this.startDate = startDate
    this.endDate = endDate
    this.completedDate = completedDate
    this.nextDay = nextDay
    this.important = important
    this.date = date
    this.event = event
    this.scheduleId = scheduleId
    this.deadline = deadline
    this.recurring = recurring
    this.extractedDate = extractedDate
    this.syncId = syncId
    this.syncName = syncName
    this.status = status
    this.parentId = parentId
    this.order = order
  }

  public static schema: Realm.ObjectSchema = {
    name: 'WeeklyToDo',
    primaryKey: 'id',
    properties: {
      id: 'string',
      notes: 'string',
      completed: 'bool?',
      startDate: 'string?',
      endDate: 'string?',
      completedDate: 'string?',
      nextDay: 'bool?',
      important: 'bool?',
      date: 'string?',
      event: 'bool?',
      scheduleId: 'string?',
      deadline: 'bool?',
      recurring: 'bool?',
      extractedDate: 'bool?',
      syncId: 'string?',
      syncName: 'string?',
      status: 'string?',
      parentId: 'string?',
      order: 'int?',
    }
  }
}

class MasterToDo {
  public id: string = ''
  public notes: string = ''
  public completed?: boolean
  public startDate?: string
  public endDate?: string
  public completedDate?: string
  public nextDay?: boolean
  public important?: boolean
  public date?: string
  public event?: boolean
  public scheduleId?: string
  public deadline?: boolean
  public recurring?: boolean
  public extractedDate?: boolean
  public syncId?: string
  public syncName?: string
  public status?: string
  public parentId?: string
  public order?: number

  constructor({
    id = '',
    notes = '',
    completed,
    startDate,
    endDate,
    completedDate,
    nextDay,
    important,
    date = dayjs().format(),
    event,
    scheduleId,
    deadline,
    recurring,
    extractedDate,
    syncId,
    syncName,
    status,
    parentId,
    order,
  }: MasterToDoType) {
    this.id = id
    this.notes = notes
    this.completed = completed
    this.startDate = startDate
    this.endDate = endDate
    this.completedDate = completedDate
    this.nextDay = nextDay
    this.important = important
    this.date = date
    this.event = event
    this.scheduleId = scheduleId
    this.deadline = deadline
    this.recurring = recurring
    this.extractedDate = extractedDate
    this.syncId = syncId
    this.syncName = syncName
    this.status = status
    this.parentId = parentId
    this.order = order
  }

  public static schema: Realm.ObjectSchema = {
    name: 'MasterToDo',
    primaryKey: 'id',
    properties: {
      id: 'string',
      notes: 'string',
      completed: 'bool?',
      startDate: 'string?',
      endDate: 'string?',
      completedDate: 'string?',
      nextDay: 'bool?',
      important: 'bool?',
      date: 'string?',
      event: 'bool?',
      scheduleId: 'string?',
      deadline: 'bool?',
      recurring: 'bool?',
      extractedDate: 'bool?',
      syncId: 'string?',
      syncName: 'string?',
      status: 'string?',
      parentId: 'string?',
      order: 'int?',
    }
  }
}

class GroceryToDo {
  public id: string = ''
  public notes: string = ''
  public completed?: boolean
  public startDate?: string
  public endDate?: string
  public completedDate?: string
  public nextDay?: boolean
  public important?: boolean
  public date?: string
  public event?: boolean
  public scheduleId?: string
  public deadline?: boolean
  public recurring?: boolean
  public extractedDate?: boolean
  public syncId?: string
  public syncName?: string
  public status?: string
  public parentId?: string
  public order?: number

  constructor({
    id = '',
    notes = '',
    completed,
    startDate,
    endDate,
    completedDate,
    nextDay,
    important,
    date = dayjs().format(),
    event,
    scheduleId,
    deadline,
    recurring,
    extractedDate,
    syncId,
    syncName,
    status,
    parentId,
    order,
  }: GroceryToDoType) {
    this.id = id
    this.notes = notes
    this.completed = completed
    this.startDate = startDate
    this.endDate = endDate
    this.completedDate = completedDate
    this.nextDay = nextDay
    this.important = important
    this.date = date
    this.event = event
    this.scheduleId = scheduleId
    this.deadline = deadline
    this.recurring = recurring
    this.extractedDate = extractedDate
    this.syncId = syncId
    this.syncName = syncName
    this.status = status
    this.parentId = parentId
    this.order = order
  }

  public static schema: Realm.ObjectSchema = {
    name: 'GroceryToDo',
    primaryKey: 'id',
    properties: {
      id: 'string',
      notes: 'string',
      completed: 'bool?',
      startDate: 'string?',
      endDate: 'string?',
      completedDate: 'string?',
      nextDay: 'bool?',
      important: 'bool?',
      date: 'string?',
      event: 'bool?',
      scheduleId: 'string?',
      deadline: 'bool?',
      recurring: 'bool?',
      extractedDate: 'bool?',
      syncId: 'string?',
      syncName: 'string?',
      status: 'string?',
      parentId: 'string?',
      order: 'int?',
    }
  }
}

export { DailyToDo, WeeklyToDo, MasterToDo, GroceryToDo }
