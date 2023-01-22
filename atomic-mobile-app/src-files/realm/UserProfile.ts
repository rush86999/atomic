
type UserProfileType = {
  id: string,
  avatar: string,
  username: string,
  email: string,
  followerCount: number,
  followingCount: number,
  postCount: number,
  bio: string,
  userId: string,
  sub: string,
  pointId: string,
}

class UserProfile {
  public id: string
  public avatar: string
  public username: string
  public email: string
  public followerCount: number
  public followingCount: number
  public postCount: number
  public bio: string
  public userId: string
  public sub: string
  public pointId: string

  constructor({
    id = '',
    avatar = '',
    username = '',
    email = '',
    followerCount = 0,
    followingCount = 0,
    postCount = 0,
    bio = '',
    userId = '',
    sub = '',
    pointId = '',
  }: UserProfileType) {

    this.id = id
    this.avatar = avatar
    this.username = username
    this.email = email
    this.followerCount = followerCount
    this.followingCount = followingCount
    this.postCount = postCount
    this.bio = bio
    this.userId = userId
    this.sub = sub
    this.pointId = pointId
  }

  public static schema: Realm.ObjectSchema = {
    name: 'UserProfile',
    primaryKey: 'id',
    properties: {
      id: 'string',
      avatar: 'string?',
      username: 'string?',
      email: 'string?',
      followerCount: 'int?',
      followingCount: 'int?',
      postCount: 'int?',
      bio: 'string?',
      userId: 'string?',
      sub: 'string?',
      pointId: 'string?',
    }
  }
}

export { UserProfile }
