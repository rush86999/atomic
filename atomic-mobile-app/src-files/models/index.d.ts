import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";

export enum ActivityType {
  COMMENT = "COMMENT",
  LIKE = "LIKE",
  FOLLOW = "FOLLOW",
  BOOKMARK = "BOOKMARK",
  REPLY = "REPLY"
}

export enum Status {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED"
}

export enum Day {
  MO = "MO",
  TU = "TU",
  WE = "WE",
  TH = "TH",
  FR = "FR",
  SA = "SA",
  SU = "SU"
}

export enum Diet {
  BALANCED = "BALANCED",
  HIGHFIBER = "HIGHFIBER",
  HIGHPROTEIN = "HIGHPROTEIN",
  LOWCARB = "LOWCARB",
  LOWSODIUM = "LOWSODIUM",
  LOWFAT = "LOWFAT"
}

export enum HealthSpecific {
  KETO = "KETO",
  SUGARCONSCIOUS = "SUGARCONSCIOUS",
  PALEO = "PALEO",
  VEGAN = "VEGAN",
  VEGETARIAN = "VEGETARIAN",
  LOWSUGAR = "LOWSUGAR",
  PECATARIAN = "PECATARIAN",
  CRUSTCEANFREE = "CRUSTCEANFREE",
  FODMAPFREE = "FODMAPFREE",
  GLUTEN = "GLUTEN",
  WHEATFREE = "WHEATFREE"
}

export enum HealthGeneric {
  ALCOHOLFREE = "ALCOHOLFREE",
  IMMUNESUPPORTIVE = "IMMUNESUPPORTIVE",
  CELERYFREE = "CELERYFREE",
  DAIRY = "DAIRY",
  EGGS = "EGGS",
  FISH = "FISH",
  KIDNEYFRIENDLY = "KIDNEYFRIENDLY",
  KOSHER = "KOSHER",
  LOWPOTASSIUM = "LOWPOTASSIUM",
  LUPINEFREE = "LUPINEFREE",
  MUSTARDFREE = "MUSTARDFREE",
  LOWFATABS = "LOWFATABS",
  NOOILADDED = "NOOILADDED",
  PEANUTFREE = "PEANUTFREE",
  PORKFREE = "PORKFREE",
  REDMEATFREE = "REDMEATFREE",
  SESAMEFREE = "SESAMEFREE",
  SHELLFISHFREE = "SHELLFISHFREE",
  SOYFREE = "SOYFREE",
  TREENUTFREE = "TREENUTFREE"
}

export enum PrimaryGoalType {
  NEWSKILLTYPE = "NEWSKILLTYPE",
  MEDITATION = "MEDITATION",
  STEP = "STEP",
  STRENGTH = "STRENGTH",
  ENDURANCE = "ENDURANCE",
  WEIGHT = "WEIGHT",
  ROUTINE = "ROUTINE",
  HABITTYPE = "HABITTYPE",
  TODO = "TODO",
  LIMITTYPE = "LIMITTYPE"
}

export enum ExerciseGoalPreference {
  REPS = "REPS",
  DISTANCE = "DISTANCE",
  WEIGHT = "WEIGHT",
  MINUTES = "MINUTES"
}

export enum EnduranceUnit {
  REPS = "REPS",
  MINUTES = "MINUTES",
  DISTANCE = "DISTANCE"
}

export enum StatPreference {
  REPS = "REPS",
  DISTANCE = "DISTANCE",
  KILOS = "KILOS",
  POUNDS = "POUNDS"
}

export enum ExerciseType {
  REPS = "REPS",
  MINUTES = "MINUTES",
  DISTANCE = "DISTANCE",
  POUNDS = "POUNDS",
  KILOS = "KILOS"
}

export enum ToDoStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE"
}

export enum Frequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY"
}

export declare class Card {
  readonly cardId?: string | null;
  readonly cardBrand?: string | null;
  readonly bin?: number | null;
  readonly preferred?: boolean | null;
  constructor(init: ModelInit<Card>);
}

export declare class RecurrenceRule {
  readonly frequency?: string | null;
  readonly endDate?: string | null;
  readonly occurrence?: number | null;
  readonly interval?: number | null;
  constructor(init: ModelInit<RecurrenceRule>);
}

export declare class Activity {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly senderId: string;
  readonly activity: ActivityType | keyof typeof ActivityType;
  readonly objectId?: string | null;
  readonly sendername: string;
  readonly ttl?: number | null;
  constructor(init: ModelInit<Activity>);
  static copyOf(source: Activity, mutator: (draft: MutableModel<Activity>) => MutableModel<Activity> | void): Activity;
}

export declare class Follower {
  readonly id: string;
  readonly userId: string;
  readonly followerProfileId: string;
  readonly avatar?: string | null;
  readonly isFollower?: boolean | null;
  readonly username: string;
  constructor(init: ModelInit<Follower>);
  static copyOf(source: Follower, mutator: (draft: MutableModel<Follower>) => MutableModel<Follower> | void): Follower;
}

export declare class Following {
  readonly id: string;
  readonly userId: string;
  readonly followingProfileId: string;
  readonly username: string;
  readonly avatar?: string | null;
  readonly isFollowing?: boolean | null;
  constructor(init: ModelInit<Following>);
  static copyOf(source: Following, mutator: (draft: MutableModel<Following>) => MutableModel<Following> | void): Following;
}

export declare class User {
  readonly id: string;
  readonly profileId: string;
  readonly sub: string;
  readonly email?: string | null;
  readonly phoneNumber?: string | null;
  readonly name?: string | null;
  readonly customerId?: string | null;
  readonly timezone?: string | null;
  readonly onboard?: boolean | null;
  readonly paymentCards?: (Card | null)[] | null;
  readonly pushToken?: string | null;
  constructor(init: ModelInit<User>);
  static copyOf(source: User, mutator: (draft: MutableModel<User>) => MutableModel<User> | void): User;
}

export declare class Goal {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly status: Status | keyof typeof Status;
  readonly endDate: string;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType?: string | null;
  readonly scheduleId?: string | null;
  readonly goal?: string | null;
  readonly goalUnit?: string | null;
  readonly previousWeek?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<Goal>);
  static copyOf(source: Goal, mutator: (draft: MutableModel<Goal>) => MutableModel<Goal> | void): Goal;
}

export declare class GoalExercise {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly status: Status | keyof typeof Status;
  readonly endDate: string;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType: string;
  readonly scheduleId?: string | null;
  readonly goal?: string | null;
  readonly goalUnit?: ExerciseGoalPreference | keyof typeof ExerciseGoalPreference | null;
  readonly previousWeek?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<GoalExercise>);
  static copyOf(source: GoalExercise, mutator: (draft: MutableModel<GoalExercise>) => MutableModel<GoalExercise> | void): GoalExercise;
}

export declare class StepData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly steps?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<StepData>);
  static copyOf(source: StepData, mutator: (draft: MutableModel<StepData>) => MutableModel<StepData> | void): StepData;
}

export declare class StrengthData {
  readonly id: string;
  readonly userId: string;
  readonly type: string;
  readonly userIdType: string;
  readonly date: string;
  readonly weight: number;
  readonly weightUnit?: string | null;
  readonly reps?: number | null;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<StrengthData>);
  static copyOf(source: StrengthData, mutator: (draft: MutableModel<StrengthData>) => MutableModel<StrengthData> | void): StrengthData;
}

export declare class EnduranceData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly minutes?: number | null;
  readonly reps?: number | null;
  readonly type: string;
  readonly distance?: number | null;
  readonly userIdType: string;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<EnduranceData>);
  static copyOf(source: EnduranceData, mutator: (draft: MutableModel<EnduranceData>) => MutableModel<EnduranceData> | void): EnduranceData;
}

export declare class WeightData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly weight: number;
  readonly ttl?: number | null;
  constructor(init: ModelInit<WeightData>);
  static copyOf(source: WeightData, mutator: (draft: MutableModel<WeightData>) => MutableModel<WeightData> | void): WeightData;
}

export declare class NewSkillTypeData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly value?: number | null;
  readonly unit?: string | null;
  readonly type: string;
  readonly userIdType: string;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<NewSkillTypeData>);
  static copyOf(source: NewSkillTypeData, mutator: (draft: MutableModel<NewSkillTypeData>) => MutableModel<NewSkillTypeData> | void): NewSkillTypeData;
}

export declare class HabitTypeData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly value?: number | null;
  readonly unit?: string | null;
  readonly type: string;
  readonly userIdType: string;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<HabitTypeData>);
  static copyOf(source: HabitTypeData, mutator: (draft: MutableModel<HabitTypeData>) => MutableModel<HabitTypeData> | void): HabitTypeData;
}

export declare class LimitTypeData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly value?: number | null;
  readonly unit?: string | null;
  readonly type: string;
  readonly userIdType: string;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<LimitTypeData>);
  static copyOf(source: LimitTypeData, mutator: (draft: MutableModel<LimitTypeData>) => MutableModel<LimitTypeData> | void): LimitTypeData;
}

export declare class MeditationData {
  readonly id: string;
  readonly date: string;
  readonly userId: string;
  readonly minutes: number;
  readonly scheduleId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<MeditationData>);
  static copyOf(source: MeditationData, mutator: (draft: MutableModel<MeditationData>) => MutableModel<MeditationData> | void): MeditationData;
}

export declare class Level {
  readonly id: string;
  readonly userId: string;
  readonly level: number;
  readonly attempts?: number | null;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType: string;
  readonly date: string;
  constructor(init: ModelInit<Level>);
  static copyOf(source: Level, mutator: (draft: MutableModel<Level>) => MutableModel<Level> | void): Level;
}

export declare class Point {
  readonly id: string;
  readonly points?: number | null;
  readonly currentPoints?: number | null;
  readonly max?: number | null;
  readonly min?: number | null;
  readonly maxDate?: string | null;
  readonly minDate?: string | null;
  readonly currentDate?: string | null;
  readonly dayCount?: number | null;
  constructor(init: ModelInit<Point>);
  static copyOf(source: Point, mutator: (draft: MutableModel<Point>) => MutableModel<Point> | void): Point;
}

export declare class UserStat {
  readonly id: string;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType?: string | null;
  readonly userId: string;
  readonly value: number;
  readonly currentValue?: number | null;
  readonly max?: number | null;
  readonly min?: number | null;
  readonly maxDate?: string | null;
  readonly minDate?: string | null;
  readonly currentDate?: string | null;
  readonly dayCount?: number | null;
  readonly lastStreakStartDate?: string | null;
  readonly lastStreakEndDate?: string | null;
  readonly lastStreakValue?: number | null;
  readonly bestStreakStartDate?: string | null;
  readonly bestStreakEndDate?: string | null;
  readonly bestStreakValue?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<UserStat>);
  static copyOf(source: UserStat, mutator: (draft: MutableModel<UserStat>) => MutableModel<UserStat> | void): UserStat;
}

export declare class ExerciseRoutine {
  readonly id: string;
  readonly routine?: Routine | null;
  readonly exercise?: Exercise | null;
  constructor(init: ModelInit<ExerciseRoutine>);
  static copyOf(source: ExerciseRoutine, mutator: (draft: MutableModel<ExerciseRoutine>) => MutableModel<ExerciseRoutine> | void): ExerciseRoutine;
}

export declare class Routine {
  readonly id: string;
  readonly name: string;
  readonly nId: string;
  readonly description?: string | null;
  readonly exercises?: (ExerciseRoutine | null)[] | null;
  constructor(init: ModelInit<Routine>);
  static copyOf(source: Routine, mutator: (draft: MutableModel<Routine>) => MutableModel<Routine> | void): Routine;
}

export declare class Exercise {
  readonly id: string;
  readonly name: string;
  readonly nId: string;
  readonly type: ExerciseType | keyof typeof ExerciseType;
  readonly description?: string | null;
  readonly routines?: (ExerciseRoutine | null)[] | null;
  constructor(init: ModelInit<Exercise>);
  static copyOf(source: Exercise, mutator: (draft: MutableModel<Exercise>) => MutableModel<Exercise> | void): Exercise;
}

export declare class UserExerciseStat {
  readonly id: string;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType: string;
  readonly userId: string;
  readonly repsValue?: number | null;
  readonly minutesValue?: number | null;
  readonly weightValue?: number | null;
  readonly distanceValue?: number | null;
  readonly currentRepsValue?: number | null;
  readonly currentMinutesValue?: number | null;
  readonly currentDistanceValue?: number | null;
  readonly currentWeightValue?: number | null;
  readonly maxReps?: number | null;
  readonly minReps?: number | null;
  readonly maxRepsDate?: string | null;
  readonly minRepsDate?: string | null;
  readonly maxMinutes?: number | null;
  readonly minMinutes?: number | null;
  readonly maxMinutesDate?: string | null;
  readonly minMinutesDate?: string | null;
  readonly maxWeight?: number | null;
  readonly minWeight?: number | null;
  readonly maxWeightDate?: string | null;
  readonly minWeightDate?: string | null;
  readonly maxDistance?: number | null;
  readonly minDistance?: number | null;
  readonly maxDistanceDate?: string | null;
  readonly minDistanceDate?: string | null;
  readonly currentDate?: string | null;
  readonly dayCount?: number | null;
  readonly unit?: string | null;
  readonly statPreference?: StatPreference | keyof typeof StatPreference | null;
  readonly lastStreakStartDate?: string | null;
  readonly lastStreakEndDate?: string | null;
  readonly lastStreakValue?: number | null;
  readonly bestStreakStartDate?: string | null;
  readonly bestStreakEndDate?: string | null;
  readonly bestStreakValue?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<UserExerciseStat>);
  static copyOf(source: UserExerciseStat, mutator: (draft: MutableModel<UserExerciseStat>) => MutableModel<UserExerciseStat> | void): UserExerciseStat;
}

export declare class DailyToDo {
  readonly id: string;
  readonly userId: string;
  readonly notes?: string | null;
  readonly completed?: boolean | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly completedDate?: string | null;
  readonly nextDay?: boolean | null;
  readonly important?: boolean | null;
  readonly date?: string | null;
  readonly event?: boolean | null;
  readonly scheduleId?: string | null;
  readonly softDeadline?: string | null;
  readonly hardDeadline?: string | null;
  readonly recurring?: boolean | null;
  readonly syncId?: string | null;
  readonly syncName?: string | null;
  readonly status?: ToDoStatus | keyof typeof ToDoStatus | null;
  readonly parentId?: string | null;
  readonly location?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly heading?: string | null;
  readonly order?: number | null;
  readonly eventId?: string | null;
  readonly duration?: number | null;
  constructor(init: ModelInit<DailyToDo>);
  static copyOf(source: DailyToDo, mutator: (draft: MutableModel<DailyToDo>) => MutableModel<DailyToDo> | void): DailyToDo;
}

export declare class ScheduleToDo {
  readonly id: string;
  readonly taskId: string;
  readonly status: Status | keyof typeof Status;
  readonly userId: string;
  readonly date: string;
  readonly dayFrequency?: number | null;
  readonly frequency: Frequency | keyof typeof Frequency;
  readonly interval?: number | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly byWeekDay?: (Day | null)[] | keyof typeof Day | null;
  readonly dayReminder?: boolean | null;
  readonly dayReminderTimeRange?: (string | null)[] | null;
  readonly dayReminderTimes?: (string | null)[] | null;
  readonly deadlineAlarms?: (string | null)[] | null;
  readonly ttl?: number | null;
  readonly eventId?: string | null;
  constructor(init: ModelInit<ScheduleToDo>);
  static copyOf(source: ScheduleToDo, mutator: (draft: MutableModel<ScheduleToDo>) => MutableModel<ScheduleToDo> | void): ScheduleToDo;
}

export declare class MasterToDo {
  readonly id: string;
  readonly userId: string;
  readonly notes?: string | null;
  readonly completed?: boolean | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly completedDate?: string | null;
  readonly nextDay?: boolean | null;
  readonly important?: boolean | null;
  readonly date?: string | null;
  readonly event?: boolean | null;
  readonly scheduleId?: string | null;
  readonly softDeadline?: string | null;
  readonly hardDeadline?: string | null;
  readonly recurring?: boolean | null;
  readonly syncId?: string | null;
  readonly syncName?: string | null;
  readonly status?: ToDoStatus | keyof typeof ToDoStatus | null;
  readonly parentId?: string | null;
  readonly location?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly heading?: string | null;
  readonly order?: number | null;
  readonly eventId?: string | null;
  readonly duration?: number | null;
  constructor(init: ModelInit<MasterToDo>);
  static copyOf(source: MasterToDo, mutator: (draft: MutableModel<MasterToDo>) => MutableModel<MasterToDo> | void): MasterToDo;
}

export declare class WeeklyToDo {
  readonly id: string;
  readonly userId: string;
  readonly notes?: string | null;
  readonly completed?: boolean | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly completedDate?: string | null;
  readonly nextDay?: boolean | null;
  readonly important?: boolean | null;
  readonly date?: string | null;
  readonly event?: boolean | null;
  readonly scheduleId?: string | null;
  readonly softDeadline?: string | null;
  readonly hardDeadline?: string | null;
  readonly recurring?: boolean | null;
  readonly syncId?: string | null;
  readonly syncName?: string | null;
  readonly status?: ToDoStatus | keyof typeof ToDoStatus | null;
  readonly parentId?: string | null;
  readonly location?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly heading?: string | null;
  readonly order?: number | null;
  readonly eventId?: string | null;
  readonly duration?: number | null;
  constructor(init: ModelInit<WeeklyToDo>);
  static copyOf(source: WeeklyToDo, mutator: (draft: MutableModel<WeeklyToDo>) => MutableModel<WeeklyToDo> | void): WeeklyToDo;
}

export declare class GroceryToDo {
  readonly id: string;
  readonly userId: string;
  readonly notes?: string | null;
  readonly completed?: boolean | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly completedDate?: string | null;
  readonly nextDay?: boolean | null;
  readonly important?: boolean | null;
  readonly date?: string | null;
  readonly event?: boolean | null;
  readonly scheduleId?: string | null;
  readonly softDeadline?: string | null;
  readonly hardDeadline?: string | null;
  readonly recurring?: boolean | null;
  readonly syncId?: string | null;
  readonly syncName?: string | null;
  readonly status?: ToDoStatus | keyof typeof ToDoStatus | null;
  readonly parentId?: string | null;
  readonly location?: string | null;
  readonly tags?: (string | null)[] | null;
  readonly heading?: string | null;
  readonly order?: number | null;
  readonly eventId?: string | null;
  readonly duration?: number | null;
  constructor(init: ModelInit<GroceryToDo>);
  static copyOf(source: GroceryToDo, mutator: (draft: MutableModel<GroceryToDo>) => MutableModel<GroceryToDo> | void): GroceryToDo;
}

export declare class Schedule {
  readonly id: string;
  readonly primaryGoalType?: PrimaryGoalType | keyof typeof PrimaryGoalType | null;
  readonly secondaryGoalType?: string | null;
  readonly status: Status | keyof typeof Status;
  readonly userId: string;
  readonly date: string;
  readonly userIdGoal: string;
  readonly unit?: string | null;
  readonly ttl?: number | null;
  readonly eventId?: string | null;
  constructor(init: ModelInit<Schedule>);
  static copyOf(source: Schedule, mutator: (draft: MutableModel<Schedule>) => MutableModel<Schedule> | void): Schedule;
}

export declare class Streak {
  readonly id: string;
  readonly dataType?: string | null;
  readonly goalId?: string | null;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType?: string | null;
  readonly userIdGoal: string;
  readonly userId: string;
  readonly streak?: number | null;
  readonly startDate: string;
  readonly endDate?: string | null;
  readonly lastSyncDate?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<Streak>);
  static copyOf(source: Streak, mutator: (draft: MutableModel<Streak>) => MutableModel<Streak> | void): Streak;
}

export declare class RoutineData {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly userIdType: string;
  readonly type: string;
  readonly rest?: number | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<RoutineData>);
  static copyOf(source: RoutineData, mutator: (draft: MutableModel<RoutineData>) => MutableModel<RoutineData> | void): RoutineData;
}

export declare class UserActivateType {
  readonly id: string;
  readonly userId: string;
  readonly primaryGoalType: PrimaryGoalType | keyof typeof PrimaryGoalType;
  readonly secondaryGoalType: string;
  readonly activated: boolean;
  readonly secondaryGoalName?: string | null;
  readonly routineId?: string | null;
  readonly exerciseId?: string | null;
  readonly unit?: string | null;
  constructor(init: ModelInit<UserActivateType>);
  static copyOf(source: UserActivateType, mutator: (draft: MutableModel<UserActivateType>) => MutableModel<UserActivateType> | void): UserActivateType;
}

export declare class Tag {
  readonly id: string;
  readonly name: string;
  readonly posts?: (PostTag | null)[] | null;
  constructor(init: ModelInit<Tag>);
  static copyOf(source: Tag, mutator: (draft: MutableModel<Tag>) => MutableModel<Tag> | void): Tag;
}

export declare class Post {
  readonly id: string;
  readonly dateDay: string;
  readonly date: string;
  readonly postUlid: string;
  readonly caption?: string | null;
  readonly tags?: (PostTag | null)[] | null;
  readonly image?: string | null;
  readonly userId: string;
  readonly likes?: (PostLike | null)[] | null;
  readonly likeCount?: number | null;
  readonly commentCount?: number | null;
  readonly avatar?: string | null;
  readonly username: string;
  readonly profileId: string;
  readonly ttl?: number | null;
  constructor(init: ModelInit<Post>);
  static copyOf(source: Post, mutator: (draft: MutableModel<Post>) => MutableModel<Post> | void): Post;
}

export declare class PostLike {
  readonly id: string;
  readonly postId: string;
  readonly userId: string;
  readonly isLike?: boolean | null;
  readonly username: string;
  readonly ttl?: number | null;
  constructor(init: ModelInit<PostLike>);
  static copyOf(source: PostLike, mutator: (draft: MutableModel<PostLike>) => MutableModel<PostLike> | void): PostLike;
}

export declare class UserProfile {
  readonly id: string;
  readonly avatar?: string | null;
  readonly username: string;
  readonly email?: string | null;
  readonly followerCount?: number | null;
  readonly followingCount?: number | null;
  readonly postCount?: number | null;
  readonly bio?: string | null;
  readonly userId: string;
  readonly sub: string;
  readonly Posts?: (Post | null)[] | null;
  readonly pointId: string;
  readonly dietSettingsId?: string | null;
  readonly mealPreferencesId?: string | null;
  constructor(init: ModelInit<UserProfile>);
  static copyOf(source: UserProfile, mutator: (draft: MutableModel<UserProfile>) => MutableModel<UserProfile> | void): UserProfile;
}

export declare class SavedPost {
  readonly id: string;
  readonly userId: string;
  readonly date: string;
  readonly postId: string;
  readonly post?: Post | null;
  constructor(init: ModelInit<SavedPost>);
  static copyOf(source: SavedPost, mutator: (draft: MutableModel<SavedPost>) => MutableModel<SavedPost> | void): SavedPost;
}

export declare class Comment {
  readonly id: string;
  readonly postId: string;
  readonly date: string;
  readonly content: string;
  readonly userId: string;
  readonly username: string;
  readonly avatar?: string | null;
  readonly profileId: string;
  readonly replyId?: string | null;
  readonly ttl?: number | null;
  constructor(init: ModelInit<Comment>);
  static copyOf(source: Comment, mutator: (draft: MutableModel<Comment>) => MutableModel<Comment> | void): Comment;
}

export declare class Integration {
  readonly id: string;
  readonly sub: string;
  readonly token?: string | null;
  readonly resource?: string | null;
  readonly resourceId?: string | null;
  readonly name?: string | null;
  readonly tableName?: string | null;
  constructor(init: ModelInit<Integration>);
  static copyOf(source: Integration, mutator: (draft: MutableModel<Integration>) => MutableModel<Integration> | void): Integration;
}

export declare class PostTag {
  readonly id: string;
  readonly tag: Tag;
  readonly post: Post;
  constructor(init: ModelInit<PostTag>);
  static copyOf(source: PostTag, mutator: (draft: MutableModel<PostTag>) => MutableModel<PostTag> | void): PostTag;
}