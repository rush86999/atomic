import Realm from 'realm'

import {
  Activity as ActivityRealm
} from '@realm/Activity'
import { BackgroundTimer } from '@realm/BackgroundTimer'
import { ExerciseTimer } from '@realm/ExerciseTimer'
import { TaskTimer } from '@realm/TaskTimer'
import { Post as PostRealm } from '@realm/Post'
import {
  DailyToDo as DailyToDoRealm,
  WeeklyToDo as WeeklyToDoRealm,
  MasterToDo as MasterToDoRealm,
  GroceryToDo as GroceryToDoRealm,
} from '@realm/UserTask'
import {
  Event as LocalEvent,
  Task as LocalTask,
  Reminder as LocalReminder,
} from '@realm/TaskSchedules'
import {
  User as UserRealm
} from '@realm/User'
import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'
import {
  Comment as CommentRealm,
} from '@realm/Comment'

import {
  OnBoard as OnBoardRealm,
} from '@realm/OnBoard'

const appConfig = {
  schema: [
    ActivityRealm.schema,
    BackgroundTimer.schema,
    ExerciseTimer.schema,
    TaskTimer.schema,
    PostRealm.schema,
    LocalTask.schema,
    LocalReminder.schema,
    LocalEvent.schema,
    DailyToDoRealm.schema,
    WeeklyToDoRealm.schema,
    MasterToDoRealm.schema,
    GroceryToDoRealm.schema,
    UserRealm.schema,
    UserProfileRealm.schema,
    CommentRealm.schema,
    OnBoardRealm.schema,
  ],
  schemaVersion: 3,
  path: "realmData"
}
let realm: Realm
export function getRealmApp() {
  try {
    realm = new Realm(appConfig)
    return realm
  } catch (e: any) {
    console.error(e, e.message, "Failed to open the realm")
  }
}
