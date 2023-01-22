// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const ActivityType = {
  "COMMENT": "COMMENT",
  "LIKE": "LIKE",
  "FOLLOW": "FOLLOW",
  "BOOKMARK": "BOOKMARK",
  "REPLY": "REPLY"
};

const Status = {
  "ACTIVE": "ACTIVE",
  "ENDED": "ENDED"
};

const Day = {
  "MO": "MO",
  "TU": "TU",
  "WE": "WE",
  "TH": "TH",
  "FR": "FR",
  "SA": "SA",
  "SU": "SU"
};

const Diet = {
  "BALANCED": "BALANCED",
  "HIGHFIBER": "HIGHFIBER",
  "HIGHPROTEIN": "HIGHPROTEIN",
  "LOWCARB": "LOWCARB",
  "LOWSODIUM": "LOWSODIUM",
  "LOWFAT": "LOWFAT"
};

const HealthSpecific = {
  "KETO": "KETO",
  "SUGARCONSCIOUS": "SUGARCONSCIOUS",
  "PALEO": "PALEO",
  "VEGAN": "VEGAN",
  "VEGETARIAN": "VEGETARIAN",
  "LOWSUGAR": "LOWSUGAR",
  "PECATARIAN": "PECATARIAN",
  "CRUSTCEANFREE": "CRUSTCEANFREE",
  "FODMAPFREE": "FODMAPFREE",
  "GLUTEN": "GLUTEN",
  "WHEATFREE": "WHEATFREE"
};

const HealthGeneric = {
  "ALCOHOLFREE": "ALCOHOLFREE",
  "IMMUNESUPPORTIVE": "IMMUNESUPPORTIVE",
  "CELERYFREE": "CELERYFREE",
  "DAIRY": "DAIRY",
  "EGGS": "EGGS",
  "FISH": "FISH",
  "KIDNEYFRIENDLY": "KIDNEYFRIENDLY",
  "KOSHER": "KOSHER",
  "LOWPOTASSIUM": "LOWPOTASSIUM",
  "LUPINEFREE": "LUPINEFREE",
  "MUSTARDFREE": "MUSTARDFREE",
  "LOWFATABS": "LOWFATABS",
  "NOOILADDED": "NOOILADDED",
  "PEANUTFREE": "PEANUTFREE",
  "PORKFREE": "PORKFREE",
  "REDMEATFREE": "REDMEATFREE",
  "SESAMEFREE": "SESAMEFREE",
  "SHELLFISHFREE": "SHELLFISHFREE",
  "SOYFREE": "SOYFREE",
  "TREENUTFREE": "TREENUTFREE"
};

const PrimaryGoalType = {
  "NEWSKILLTYPE": "NEWSKILLTYPE",
  "MEDITATION": "MEDITATION",
  "STEP": "STEP",
  "STRENGTH": "STRENGTH",
  "ENDURANCE": "ENDURANCE",
  "WEIGHT": "WEIGHT",
  "ROUTINE": "ROUTINE",
  "HABITTYPE": "HABITTYPE",
  "TODO": "TODO",
  "LIMITTYPE": "LIMITTYPE"
};

const ExerciseGoalPreference = {
  "REPS": "REPS",
  "DISTANCE": "DISTANCE",
  "WEIGHT": "WEIGHT",
  "MINUTES": "MINUTES"
};

const EnduranceUnit = {
  "REPS": "REPS",
  "MINUTES": "MINUTES",
  "DISTANCE": "DISTANCE"
};

const StatPreference = {
  "REPS": "REPS",
  "DISTANCE": "DISTANCE",
  "KILOS": "KILOS",
  "POUNDS": "POUNDS"
};

const ExerciseType = {
  "REPS": "REPS",
  "MINUTES": "MINUTES",
  "DISTANCE": "DISTANCE",
  "POUNDS": "POUNDS",
  "KILOS": "KILOS"
};

const ToDoStatus = {
  "TODO": "TODO",
  "DOING": "DOING",
  "DONE": "DONE"
};

const Frequency = {
  "DAILY": "DAILY",
  "WEEKLY": "WEEKLY",
  "MONTHLY": "MONTHLY",
  "YEARLY": "YEARLY"
};

const { Activity, Follower, Following, User, Goal, GoalExercise, StepData, StrengthData, EnduranceData, WeightData, NewSkillTypeData, HabitTypeData, LimitTypeData, MeditationData, Level, Point, UserStat, ExerciseRoutine, Routine, Exercise, UserExerciseStat, DailyToDo, ScheduleToDo, MasterToDo, WeeklyToDo, GroceryToDo, Schedule, Streak, RoutineData, UserActivateType, Tag, Post, PostLike, UserProfile, SavedPost, Comment, Integration, PostTag, Card, RecurrenceRule } = initSchema(schema);

export {
  Activity,
  Follower,
  Following,
  User,
  Goal,
  GoalExercise,
  StepData,
  StrengthData,
  EnduranceData,
  WeightData,
  NewSkillTypeData,
  HabitTypeData,
  LimitTypeData,
  MeditationData,
  Level,
  Point,
  UserStat,
  ExerciseRoutine,
  Routine,
  Exercise,
  UserExerciseStat,
  DailyToDo,
  ScheduleToDo,
  MasterToDo,
  WeeklyToDo,
  GroceryToDo,
  Schedule,
  Streak,
  RoutineData,
  UserActivateType,
  Tag,
  Post,
  PostLike,
  UserProfile,
  SavedPost,
  Comment,
  Integration,
  PostTag,
  ActivityType,
  Status,
  Day,
  Diet,
  HealthSpecific,
  HealthGeneric,
  PrimaryGoalType,
  ExerciseGoalPreference,
  EnduranceUnit,
  StatPreference,
  ExerciseType,
  ToDoStatus,
  Frequency,
  Card,
  RecurrenceRule
};