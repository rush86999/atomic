import { v4 as uuid } from 'uuid'

type OnBoardType = {
  id: string,
  UserCreateSpecificExercise?: boolean,
  UserCreateActivateSpecificExercise?: boolean,
  UserCreateActivateHabit?: boolean,
  UserCreateActivateLimit?: boolean,
  UserCreateActivateNewSkill?: boolean,
  UserTask?: boolean,
}

class OnBoard {
  id: string
  UserCreateSpecificExercise: boolean | undefined
  UserCreateActivateSpecificExercise: boolean | undefined
  UserCreateActivateHabit: boolean | undefined
  UserCreateActivateLimit: boolean | undefined
  UserCreateActivateNewSkill: boolean | undefined
  UserTask: boolean | undefined

  constructor({
    id = uuid(),
    UserCreateSpecificExercise,
    UserCreateActivateSpecificExercise,
    UserCreateActivateHabit,
    UserCreateActivateLimit,
    UserCreateActivateNewSkill,
    UserTask,

  }: OnBoardType) {

    this.id = id
    this.UserCreateSpecificExercise = UserCreateSpecificExercise
    this.UserCreateActivateSpecificExercise = UserCreateActivateSpecificExercise
    this.UserCreateActivateHabit = UserCreateActivateHabit
    this.UserCreateActivateLimit = UserCreateActivateLimit
    this.UserCreateActivateNewSkill = UserCreateActivateNewSkill
    this.UserTask = UserTask
  }

  static schema = {
    name: 'OnBoard',
    properties: {
      id: 'string',
      UserCreateSpecificExercise: 'bool?',
      UserCreateActivateSpecificExercise: 'bool?',
      UserCreateActivateHabit: 'bool?',
      UserCreateActivateLimit: 'bool?',
      UserCreateActivateNewSkill: 'bool?',
      UserTask: 'bool?',
    },
    primaryKey: 'id',
  }
}

export {OnBoard}
