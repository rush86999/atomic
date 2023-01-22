// import {ObjectId} from 'bson'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

// dayjs.extend(utc)


type PostType = {
  id: string,
  dateDay: string,
  date: string,
  caption?: string,
  image?: string,
  // userId: string,
}

class Post {
  public id: string = ''
  public dateDay: string = ''
  public date: string = ''
  public caption?: string = ''
  public image?: string = ''

  constructor({
    id = '',
    dateDay = dayjs().format('YYYY-MM-DD'),
    date = dayjs().format(),
    caption = '',
    image = '',
  }: PostType) {
    this.id = id
    this.dateDay = dateDay
    this.date = date
    this.caption = caption
    this.image = image
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Post',
    primaryKey: 'id',
    properties: {
      id: 'string',
      dateDay: 'string',
      date: 'string',
      caption: 'string?',
      image: 'string?',
    }
  }

}

export { Post }
