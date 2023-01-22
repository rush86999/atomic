import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

// dayjs.extend(utc)

type ActivityType = {
  id: string,
  read: boolean,
  date: string,
  dateUnix: number,
  senderId: string,
  activity: string,
  objectId: string,
  sendername: string,
  ttl: string,
}

class Activity {
  public id: string = ''
  public read: boolean = false
  public date: string
  public dateUnix: number
  public senderId: string
  public activity: string
  public objectId: string
  public sendername: string
  public ttl: string

  constructor({
    id = '',
    read = false,
    date = '',
    dateUnix = -1,
    senderId = '',
    activity = '',
    objectId = '',
    sendername = '',
    ttl = dayjs().add(1, 'y').format(),
  }: ActivityType) {
    this.id = id
    this.read = read
    this.date = date
    this.dateUnix = dateUnix
    this.senderId = senderId
    this.activity = activity
    this.objectId = objectId
    this.sendername = sendername
    this.ttl = ttl
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Activity',
    primaryKey: 'id',
    properties: {
      id: 'string',
      date: 'string',
      dateUnix: 'int',
      senderId: 'string',
      activity: 'string',
      objectId: 'string',
      sendername: 'string',
      read: 'bool',
      ttl: 'string',
    }
  }
}

export { Activity }
