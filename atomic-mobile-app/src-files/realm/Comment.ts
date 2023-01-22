import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

// dayjs.extend(utc)

type CommentType = {
  id: string,
  postId: string,
  date: string,
  content: string,
  userId: string,
  username: string,
  avatar?: string,
  profileId: string,
  replyId?: string,
}

class Comment {
  public id: string = ''
  public postId: string = ''
  public date: string = ''
  public content: string = ''
  public userId: string = ''
  public username: string = ''
  public avatar?: string = ''
  public profileId: string = ''
  public replyId?: string = ''

  constructor({
    id = '',
    postId = '',
    date = dayjs().format(),
    content = '',
    userId = '',
    username = '',
    avatar = '',
    profileId = '',
    replyId = '',
  }: CommentType) {
    this.id = id
    this.date = date
    this.postId = postId
    this.content = content
    this.userId = userId
    this.username = username
    this.avatar = avatar
    this.profileId = profileId
    this.replyId = replyId
  }

  public static schema: Realm.ObjectSchema = {
    name: 'Comment',
    primaryKey: 'id',
    properties: {
      id: 'string',
      date: 'string',
      postId: 'string',
      content: 'string',
      userId: 'string',
      username: 'string',
      avatar: 'string?',
      profileId: 'string',
      replyId: 'string?',

    }
  }

}

export { Comment }
