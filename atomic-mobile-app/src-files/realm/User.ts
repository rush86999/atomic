
type UserType = {
  id: number,
  sub: string,
  email: string,
  isNew: boolean,
}

class User {
  public id: number
  public sub: string
  public email: string
  public isNew: boolean

  constructor({
    id = 1,
    sub = '',
    email = '',
    isNew = false,
  }: UserType) {
    this.id = id
    this.sub = sub
    this.email = email
    this.isNew = isNew
  }

  public static schema: Realm.ObjectSchema = {
    name: 'User',
    primaryKey: 'id',
    properties: {
      id: 'int',
      sub: 'string',
      email: 'string?',
      isNew: 'bool?',
    }
  }

}

export {User}
