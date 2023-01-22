/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateActivityInput = {
  id?: string | null,
  userId: string,
  date: string,
  senderId: string,
  activity: ActivityType,
  objectId?: string | null,
  sendername: string,
  ttl?: number | null,
  _version?: number | null,
};

export enum ActivityType {
  COMMENT = "COMMENT",
  LIKE = "LIKE",
  FOLLOW = "FOLLOW",
  BOOKMARK = "BOOKMARK",
  REPLY = "REPLY",
}


export type ModelActivityConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  senderId?: ModelIDInput | null,
  activity?: ModelActivityTypeInput | null,
  objectId?: ModelIDInput | null,
  sendername?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelActivityConditionInput | null > | null,
  or?: Array< ModelActivityConditionInput | null > | null,
  not?: ModelActivityConditionInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelActivityTypeInput = {
  eq?: ActivityType | null,
  ne?: ActivityType | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Activity = {
  __typename: "Activity",
  id: string,
  userId: string,
  date: string,
  senderId: string,
  activity: ActivityType,
  objectId?: string | null,
  sendername: string,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateActivityInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  senderId?: string | null,
  activity?: ActivityType | null,
  objectId?: string | null,
  sendername?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteActivityInput = {
  id: string,
  _version?: number | null,
};

export type CreateFollowerInput = {
  id?: string | null,
  userId: string,
  followerProfileId: string,
  avatar?: string | null,
  isFollower?: boolean | null,
  username: string,
  _version?: number | null,
};

export type ModelFollowerConditionInput = {
  avatar?: ModelStringInput | null,
  isFollower?: ModelBooleanInput | null,
  username?: ModelStringInput | null,
  and?: Array< ModelFollowerConditionInput | null > | null,
  or?: Array< ModelFollowerConditionInput | null > | null,
  not?: ModelFollowerConditionInput | null,
};

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Follower = {
  __typename: "Follower",
  id: string,
  userId: string,
  followerProfileId: string,
  avatar?: string | null,
  isFollower?: boolean | null,
  username: string,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateFollowerInput = {
  id?: string | null,
  userId: string,
  followerProfileId: string,
  avatar?: string | null,
  isFollower?: boolean | null,
  username?: string | null,
  _version?: number | null,
};

export type DeleteFollowerInput = {
  userId: string,
  followerProfileId: string,
  _version?: number | null,
};

export type CreateFollowingInput = {
  id?: string | null,
  userId: string,
  followingProfileId: string,
  username: string,
  avatar?: string | null,
  isFollowing?: boolean | null,
  _version?: number | null,
};

export type ModelFollowingConditionInput = {
  userId?: ModelIDInput | null,
  followingProfileId?: ModelIDInput | null,
  username?: ModelStringInput | null,
  avatar?: ModelStringInput | null,
  isFollowing?: ModelBooleanInput | null,
  and?: Array< ModelFollowingConditionInput | null > | null,
  or?: Array< ModelFollowingConditionInput | null > | null,
  not?: ModelFollowingConditionInput | null,
};

export type Following = {
  __typename: "Following",
  id: string,
  userId: string,
  followingProfileId: string,
  username: string,
  avatar?: string | null,
  isFollowing?: boolean | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateFollowingInput = {
  id: string,
  userId?: string | null,
  followingProfileId?: string | null,
  username?: string | null,
  avatar?: string | null,
  isFollowing?: boolean | null,
  _version?: number | null,
};

export type DeleteFollowingInput = {
  id: string,
  _version?: number | null,
};

export type CreateUserInput = {
  id?: string | null,
  profileId: string,
  sub: string,
  email?: string | null,
  phoneNumber?: string | null,
  name?: string | null,
  customerId?: string | null,
  timezone?: string | null,
  onboard?: boolean | null,
  paymentCards?: Array< CardInput | null > | null,
  pushToken?: string | null,
  _version?: number | null,
};

export type CardInput = {
  cardId?: string | null,
  cardBrand?: string | null,
  bin?: number | null,
  preferred?: boolean | null,
};

export type ModelUserConditionInput = {
  profileId?: ModelIDInput | null,
  sub?: ModelIDInput | null,
  email?: ModelStringInput | null,
  phoneNumber?: ModelStringInput | null,
  name?: ModelStringInput | null,
  customerId?: ModelStringInput | null,
  timezone?: ModelStringInput | null,
  onboard?: ModelBooleanInput | null,
  pushToken?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
};

export type User = {
  __typename: "User",
  id: string,
  profileId: string,
  sub: string,
  email?: string | null,
  phoneNumber?: string | null,
  name?: string | null,
  customerId?: string | null,
  timezone?: string | null,
  onboard?: boolean | null,
  paymentCards?:  Array<Card | null > | null,
  pushToken?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type Card = {
  __typename: "Card",
  cardId?: string | null,
  cardBrand?: string | null,
  bin?: number | null,
  preferred?: boolean | null,
};

export type UpdateUserInput = {
  id: string,
  profileId?: string | null,
  sub?: string | null,
  email?: string | null,
  phoneNumber?: string | null,
  name?: string | null,
  customerId?: string | null,
  timezone?: string | null,
  onboard?: boolean | null,
  paymentCards?: Array< CardInput | null > | null,
  pushToken?: string | null,
  _version?: number | null,
};

export type DeleteUserInput = {
  id: string,
  _version?: number | null,
};

export type CreateGoalInput = {
  id?: string | null,
  userId: string,
  date: string,
  status: Status,
  endDate: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: string | null,
  previousWeek?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export enum Status {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
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
  LIMITTYPE = "LIMITTYPE",
}


export type ModelGoalConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  endDate?: ModelStringInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  goal?: ModelStringInput | null,
  goalUnit?: ModelStringInput | null,
  previousWeek?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelGoalConditionInput | null > | null,
  or?: Array< ModelGoalConditionInput | null > | null,
  not?: ModelGoalConditionInput | null,
};

export type ModelStatusInput = {
  eq?: Status | null,
  ne?: Status | null,
};

export type ModelPrimaryGoalTypeInput = {
  eq?: PrimaryGoalType | null,
  ne?: PrimaryGoalType | null,
};

export type Goal = {
  __typename: "Goal",
  id: string,
  userId: string,
  date: string,
  status: Status,
  endDate: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: string | null,
  previousWeek?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateGoalInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  status?: Status | null,
  endDate?: string | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: string | null,
  previousWeek?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteGoalInput = {
  id: string,
  _version?: number | null,
};

export type CreateGoalExerciseInput = {
  id?: string | null,
  userId: string,
  date: string,
  status: Status,
  endDate: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: ExerciseGoalPreference | null,
  previousWeek?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export enum ExerciseGoalPreference {
  REPS = "REPS",
  DISTANCE = "DISTANCE",
  WEIGHT = "WEIGHT",
  MINUTES = "MINUTES",
}


export type ModelGoalExerciseConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  endDate?: ModelStringInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  goal?: ModelStringInput | null,
  goalUnit?: ModelExerciseGoalPreferenceInput | null,
  previousWeek?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelGoalExerciseConditionInput | null > | null,
  or?: Array< ModelGoalExerciseConditionInput | null > | null,
  not?: ModelGoalExerciseConditionInput | null,
};

export type ModelExerciseGoalPreferenceInput = {
  eq?: ExerciseGoalPreference | null,
  ne?: ExerciseGoalPreference | null,
};

export type GoalExercise = {
  __typename: "GoalExercise",
  id: string,
  userId: string,
  date: string,
  status: Status,
  endDate: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: ExerciseGoalPreference | null,
  previousWeek?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateGoalExerciseInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  status?: Status | null,
  endDate?: string | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  scheduleId?: string | null,
  goal?: string | null,
  goalUnit?: ExerciseGoalPreference | null,
  previousWeek?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteGoalExerciseInput = {
  id: string,
  _version?: number | null,
};

export type CreateStepDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  steps?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelStepDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  steps?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStepDataConditionInput | null > | null,
  or?: Array< ModelStepDataConditionInput | null > | null,
  not?: ModelStepDataConditionInput | null,
};

export type StepData = {
  __typename: "StepData",
  id: string,
  date: string,
  userId: string,
  steps?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateStepDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  steps?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteStepDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateStrengthDataInput = {
  id?: string | null,
  userId: string,
  type: string,
  userIdType: string,
  date: string,
  weight: number,
  weightUnit?: string | null,
  reps?: number | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelStrengthDataConditionInput = {
  userId?: ModelIDInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  date?: ModelStringInput | null,
  weight?: ModelFloatInput | null,
  weightUnit?: ModelStringInput | null,
  reps?: ModelFloatInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStrengthDataConditionInput | null > | null,
  or?: Array< ModelStrengthDataConditionInput | null > | null,
  not?: ModelStrengthDataConditionInput | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type StrengthData = {
  __typename: "StrengthData",
  id: string,
  userId: string,
  type: string,
  userIdType: string,
  date: string,
  weight: number,
  weightUnit?: string | null,
  reps?: number | null,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateStrengthDataInput = {
  id: string,
  userId?: string | null,
  type?: string | null,
  userIdType?: string | null,
  date?: string | null,
  weight?: number | null,
  weightUnit?: string | null,
  reps?: number | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteStrengthDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateEnduranceDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  minutes?: number | null,
  reps?: number | null,
  type: string,
  distance?: number | null,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelEnduranceDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  minutes?: ModelFloatInput | null,
  reps?: ModelFloatInput | null,
  type?: ModelStringInput | null,
  distance?: ModelFloatInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelEnduranceDataConditionInput | null > | null,
  or?: Array< ModelEnduranceDataConditionInput | null > | null,
  not?: ModelEnduranceDataConditionInput | null,
};

export type EnduranceData = {
  __typename: "EnduranceData",
  id: string,
  date: string,
  userId: string,
  minutes?: number | null,
  reps?: number | null,
  type: string,
  distance?: number | null,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateEnduranceDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  minutes?: number | null,
  reps?: number | null,
  type?: string | null,
  distance?: number | null,
  userIdType?: string | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteEnduranceDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateWeightDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  weight: number,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelWeightDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  weight?: ModelFloatInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelWeightDataConditionInput | null > | null,
  or?: Array< ModelWeightDataConditionInput | null > | null,
  not?: ModelWeightDataConditionInput | null,
};

export type WeightData = {
  __typename: "WeightData",
  id: string,
  date: string,
  userId: string,
  weight: number,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateWeightDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  weight?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteWeightDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateNewSkillTypeDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelNewSkillTypeDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelNewSkillTypeDataConditionInput | null > | null,
  or?: Array< ModelNewSkillTypeDataConditionInput | null > | null,
  not?: ModelNewSkillTypeDataConditionInput | null,
};

export type NewSkillTypeData = {
  __typename: "NewSkillTypeData",
  id: string,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateNewSkillTypeDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  value?: number | null,
  unit?: string | null,
  type?: string | null,
  userIdType?: string | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteNewSkillTypeDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateHabitTypeDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelHabitTypeDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelHabitTypeDataConditionInput | null > | null,
  or?: Array< ModelHabitTypeDataConditionInput | null > | null,
  not?: ModelHabitTypeDataConditionInput | null,
};

export type HabitTypeData = {
  __typename: "HabitTypeData",
  id: string,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateHabitTypeDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  value?: number | null,
  unit?: string | null,
  type?: string | null,
  userIdType?: string | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteHabitTypeDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateLimitTypeDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelLimitTypeDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelLimitTypeDataConditionInput | null > | null,
  or?: Array< ModelLimitTypeDataConditionInput | null > | null,
  not?: ModelLimitTypeDataConditionInput | null,
};

export type LimitTypeData = {
  __typename: "LimitTypeData",
  id: string,
  date: string,
  userId: string,
  value?: number | null,
  unit?: string | null,
  type: string,
  userIdType: string,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateLimitTypeDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  value?: number | null,
  unit?: string | null,
  type?: string | null,
  userIdType?: string | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteLimitTypeDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateMeditationDataInput = {
  id?: string | null,
  date: string,
  userId: string,
  minutes: number,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelMeditationDataConditionInput = {
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  minutes?: ModelFloatInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelMeditationDataConditionInput | null > | null,
  or?: Array< ModelMeditationDataConditionInput | null > | null,
  not?: ModelMeditationDataConditionInput | null,
};

export type MeditationData = {
  __typename: "MeditationData",
  id: string,
  date: string,
  userId: string,
  minutes: number,
  scheduleId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateMeditationDataInput = {
  id: string,
  date?: string | null,
  userId?: string | null,
  minutes?: number | null,
  scheduleId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteMeditationDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateLevelInput = {
  id?: string | null,
  userId: string,
  level: number,
  attempts?: number | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  date: string,
  _version?: number | null,
};

export type ModelLevelConditionInput = {
  userId?: ModelIDInput | null,
  level?: ModelIntInput | null,
  attempts?: ModelIntInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  date?: ModelStringInput | null,
  and?: Array< ModelLevelConditionInput | null > | null,
  or?: Array< ModelLevelConditionInput | null > | null,
  not?: ModelLevelConditionInput | null,
};

export type Level = {
  __typename: "Level",
  id: string,
  userId: string,
  level: number,
  attempts?: number | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  date: string,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateLevelInput = {
  id: string,
  userId?: string | null,
  level?: number | null,
  attempts?: number | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  date?: string | null,
  _version?: number | null,
};

export type DeleteLevelInput = {
  id: string,
  _version?: number | null,
};

export type CreatePointInput = {
  id?: string | null,
  points?: number | null,
  currentPoints?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  _version?: number | null,
};

export type ModelPointConditionInput = {
  points?: ModelIntInput | null,
  currentPoints?: ModelIntInput | null,
  max?: ModelIntInput | null,
  min?: ModelIntInput | null,
  maxDate?: ModelStringInput | null,
  minDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  and?: Array< ModelPointConditionInput | null > | null,
  or?: Array< ModelPointConditionInput | null > | null,
  not?: ModelPointConditionInput | null,
};

export type Point = {
  __typename: "Point",
  id: string,
  points?: number | null,
  currentPoints?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdatePointInput = {
  id: string,
  points?: number | null,
  currentPoints?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  _version?: number | null,
};

export type DeletePointInput = {
  id: string,
  _version?: number | null,
};

export type CreateUserStatInput = {
  id?: string | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  userId: string,
  value: number,
  currentValue?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelUserStatConditionInput = {
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  currentValue?: ModelFloatInput | null,
  max?: ModelFloatInput | null,
  min?: ModelFloatInput | null,
  maxDate?: ModelStringInput | null,
  minDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  lastStreakStartDate?: ModelStringInput | null,
  lastStreakEndDate?: ModelStringInput | null,
  lastStreakValue?: ModelIntInput | null,
  bestStreakStartDate?: ModelStringInput | null,
  bestStreakEndDate?: ModelStringInput | null,
  bestStreakValue?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelUserStatConditionInput | null > | null,
  or?: Array< ModelUserStatConditionInput | null > | null,
  not?: ModelUserStatConditionInput | null,
};

export type UserStat = {
  __typename: "UserStat",
  id: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  userId: string,
  value: number,
  currentValue?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateUserStatInput = {
  id: string,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  userId?: string | null,
  value?: number | null,
  currentValue?: number | null,
  max?: number | null,
  min?: number | null,
  maxDate?: string | null,
  minDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteUserStatInput = {
  id: string,
  _version?: number | null,
};

export type CreateExerciseRoutineInput = {
  id?: string | null,
  routineId: string,
  exerciseId: string,
  _version?: number | null,
};

export type ModelExerciseRoutineConditionInput = {
  routineId?: ModelIDInput | null,
  exerciseId?: ModelIDInput | null,
  and?: Array< ModelExerciseRoutineConditionInput | null > | null,
  or?: Array< ModelExerciseRoutineConditionInput | null > | null,
  not?: ModelExerciseRoutineConditionInput | null,
};

export type ExerciseRoutine = {
  __typename: "ExerciseRoutine",
  id: string,
  routineId: string,
  exerciseId: string,
  routine?: Routine | null,
  exercise?: Exercise | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export type Routine = {
  __typename: "Routine",
  id: string,
  name: string,
  nId: string,
  description?: string | null,
  exercises?: ModelExerciseRoutineConnection | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export type ModelExerciseRoutineConnection = {
  __typename: "ModelExerciseRoutineConnection",
  items:  Array<ExerciseRoutine | null >,
  nextToken?: string | null,
};

export type Exercise = {
  __typename: "Exercise",
  id: string,
  name: string,
  nId: string,
  type: ExerciseType,
  description?: string | null,
  routines?: ModelExerciseRoutineConnection | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export enum ExerciseType {
  REPS = "REPS",
  MINUTES = "MINUTES",
  DISTANCE = "DISTANCE",
  POUNDS = "POUNDS",
  KILOS = "KILOS",
}


export type UpdateExerciseRoutineInput = {
  id: string,
  routineId?: string | null,
  exerciseId?: string | null,
  _version?: number | null,
};

export type DeleteExerciseRoutineInput = {
  id: string,
  _version?: number | null,
};

export type CreateRoutineInput = {
  id?: string | null,
  name: string,
  nId: string,
  description?: string | null,
  _version?: number | null,
};

export type ModelRoutineConditionInput = {
  name?: ModelIDInput | null,
  nId?: ModelIDInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelRoutineConditionInput | null > | null,
  or?: Array< ModelRoutineConditionInput | null > | null,
  not?: ModelRoutineConditionInput | null,
};

export type UpdateRoutineInput = {
  id: string,
  name?: string | null,
  nId?: string | null,
  description?: string | null,
  _version?: number | null,
};

export type DeleteRoutineInput = {
  id: string,
  _version?: number | null,
};

export type CreateExerciseInput = {
  id?: string | null,
  name: string,
  nId: string,
  type: ExerciseType,
  description?: string | null,
  _version?: number | null,
};

export type ModelExerciseConditionInput = {
  name?: ModelIDInput | null,
  nId?: ModelIDInput | null,
  type?: ModelExerciseTypeInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelExerciseConditionInput | null > | null,
  or?: Array< ModelExerciseConditionInput | null > | null,
  not?: ModelExerciseConditionInput | null,
};

export type ModelExerciseTypeInput = {
  eq?: ExerciseType | null,
  ne?: ExerciseType | null,
};

export type UpdateExerciseInput = {
  id: string,
  name?: string | null,
  nId?: string | null,
  type?: ExerciseType | null,
  description?: string | null,
  _version?: number | null,
};

export type DeleteExerciseInput = {
  id: string,
  _version?: number | null,
};

export type CreateUserExerciseStatInput = {
  id?: string | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  userId: string,
  repsValue?: number | null,
  minutesValue?: number | null,
  weightValue?: number | null,
  distanceValue?: number | null,
  currentRepsValue?: number | null,
  currentMinutesValue?: number | null,
  currentDistanceValue?: number | null,
  currentWeightValue?: number | null,
  maxReps?: number | null,
  minReps?: number | null,
  maxRepsDate?: string | null,
  minRepsDate?: string | null,
  maxMinutes?: number | null,
  minMinutes?: number | null,
  maxMinutesDate?: string | null,
  minMinutesDate?: string | null,
  maxWeight?: number | null,
  minWeight?: number | null,
  maxWeightDate?: string | null,
  minWeightDate?: string | null,
  maxDistance?: number | null,
  minDistance?: number | null,
  maxDistanceDate?: string | null,
  minDistanceDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  unit?: string | null,
  statPreference?: StatPreference | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export enum StatPreference {
  REPS = "REPS",
  DISTANCE = "DISTANCE",
  KILOS = "KILOS",
  POUNDS = "POUNDS",
}


export type ModelUserExerciseStatConditionInput = {
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  repsValue?: ModelFloatInput | null,
  minutesValue?: ModelFloatInput | null,
  weightValue?: ModelFloatInput | null,
  distanceValue?: ModelFloatInput | null,
  currentRepsValue?: ModelFloatInput | null,
  currentMinutesValue?: ModelFloatInput | null,
  currentDistanceValue?: ModelFloatInput | null,
  currentWeightValue?: ModelFloatInput | null,
  maxReps?: ModelFloatInput | null,
  minReps?: ModelFloatInput | null,
  maxRepsDate?: ModelStringInput | null,
  minRepsDate?: ModelStringInput | null,
  maxMinutes?: ModelFloatInput | null,
  minMinutes?: ModelFloatInput | null,
  maxMinutesDate?: ModelStringInput | null,
  minMinutesDate?: ModelStringInput | null,
  maxWeight?: ModelFloatInput | null,
  minWeight?: ModelFloatInput | null,
  maxWeightDate?: ModelStringInput | null,
  minWeightDate?: ModelStringInput | null,
  maxDistance?: ModelFloatInput | null,
  minDistance?: ModelFloatInput | null,
  maxDistanceDate?: ModelStringInput | null,
  minDistanceDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  unit?: ModelStringInput | null,
  statPreference?: ModelStatPreferenceInput | null,
  lastStreakStartDate?: ModelStringInput | null,
  lastStreakEndDate?: ModelStringInput | null,
  lastStreakValue?: ModelIntInput | null,
  bestStreakStartDate?: ModelStringInput | null,
  bestStreakEndDate?: ModelStringInput | null,
  bestStreakValue?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelUserExerciseStatConditionInput | null > | null,
  or?: Array< ModelUserExerciseStatConditionInput | null > | null,
  not?: ModelUserExerciseStatConditionInput | null,
};

export type ModelStatPreferenceInput = {
  eq?: StatPreference | null,
  ne?: StatPreference | null,
};

export type UserExerciseStat = {
  __typename: "UserExerciseStat",
  id: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  userId: string,
  repsValue?: number | null,
  minutesValue?: number | null,
  weightValue?: number | null,
  distanceValue?: number | null,
  currentRepsValue?: number | null,
  currentMinutesValue?: number | null,
  currentDistanceValue?: number | null,
  currentWeightValue?: number | null,
  maxReps?: number | null,
  minReps?: number | null,
  maxRepsDate?: string | null,
  minRepsDate?: string | null,
  maxMinutes?: number | null,
  minMinutes?: number | null,
  maxMinutesDate?: string | null,
  minMinutesDate?: string | null,
  maxWeight?: number | null,
  minWeight?: number | null,
  maxWeightDate?: string | null,
  minWeightDate?: string | null,
  maxDistance?: number | null,
  minDistance?: number | null,
  maxDistanceDate?: string | null,
  minDistanceDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  unit?: string | null,
  statPreference?: StatPreference | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateUserExerciseStatInput = {
  id: string,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  userId?: string | null,
  repsValue?: number | null,
  minutesValue?: number | null,
  weightValue?: number | null,
  distanceValue?: number | null,
  currentRepsValue?: number | null,
  currentMinutesValue?: number | null,
  currentDistanceValue?: number | null,
  currentWeightValue?: number | null,
  maxReps?: number | null,
  minReps?: number | null,
  maxRepsDate?: string | null,
  minRepsDate?: string | null,
  maxMinutes?: number | null,
  minMinutes?: number | null,
  maxMinutesDate?: string | null,
  minMinutesDate?: string | null,
  maxWeight?: number | null,
  minWeight?: number | null,
  maxWeightDate?: string | null,
  minWeightDate?: string | null,
  maxDistance?: number | null,
  minDistance?: number | null,
  maxDistanceDate?: string | null,
  minDistanceDate?: string | null,
  currentDate?: string | null,
  dayCount?: number | null,
  unit?: string | null,
  statPreference?: StatPreference | null,
  lastStreakStartDate?: string | null,
  lastStreakEndDate?: string | null,
  lastStreakValue?: number | null,
  bestStreakStartDate?: string | null,
  bestStreakEndDate?: string | null,
  bestStreakValue?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteUserExerciseStatInput = {
  id: string,
  _version?: number | null,
};

export type CreateDailyToDoInput = {
  id?: string | null,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export enum ToDoStatus {
  TODO = "TODO",
  DOING = "DOING",
  DONE = "DONE",
}


export type ModelDailyToDoConditionInput = {
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelDailyToDoConditionInput | null > | null,
  or?: Array< ModelDailyToDoConditionInput | null > | null,
  not?: ModelDailyToDoConditionInput | null,
};

export type ModelToDoStatusInput = {
  eq?: ToDoStatus | null,
  ne?: ToDoStatus | null,
};

export type DailyToDo = {
  __typename: "DailyToDo",
  id: string,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateDailyToDoInput = {
  id: string,
  userId?: string | null,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type DeleteDailyToDoInput = {
  id: string,
  _version?: number | null,
};

export type CreateScheduleToDoInput = {
  id?: string | null,
  taskId: string,
  status: Status,
  userId: string,
  date: string,
  dayFrequency?: number | null,
  frequency: FREQUENCY,
  interval?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  byWeekDay?: Array< Day | null > | null,
  dayReminder?: boolean | null,
  dayReminderTimeRange?: Array< string | null > | null,
  dayReminderTimes?: Array< string | null > | null,
  deadlineAlarms?: Array< string | null > | null,
  ttl?: number | null,
  eventId?: string | null,
  _version?: number | null,
};

export enum FREQUENCY {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}


export enum Day {
  MO = "MO",
  TU = "TU",
  WE = "WE",
  TH = "TH",
  FR = "FR",
  SA = "SA",
  SU = "SU",
}


export type ModelScheduleToDoConditionInput = {
  taskId?: ModelIDInput | null,
  status?: ModelStatusInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  dayFrequency?: ModelIntInput | null,
  frequency?: ModelFREQUENCYInput | null,
  interval?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  byWeekDay?: ModelDayListInput | null,
  dayReminder?: ModelBooleanInput | null,
  dayReminderTimeRange?: ModelStringInput | null,
  dayReminderTimes?: ModelStringInput | null,
  deadlineAlarms?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  and?: Array< ModelScheduleToDoConditionInput | null > | null,
  or?: Array< ModelScheduleToDoConditionInput | null > | null,
  not?: ModelScheduleToDoConditionInput | null,
};

export type ModelFREQUENCYInput = {
  eq?: FREQUENCY | null,
  ne?: FREQUENCY | null,
};

export type ModelDayListInput = {
  eq?: Array< Day | null > | null,
  ne?: Array< Day | null > | null,
  contains?: Day | null,
  notContains?: Day | null,
};

export type ScheduleToDo = {
  __typename: "ScheduleToDo",
  id: string,
  taskId: string,
  status: Status,
  userId: string,
  date: string,
  dayFrequency?: number | null,
  frequency: FREQUENCY,
  interval?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  byWeekDay?: Array< Day | null > | null,
  dayReminder?: boolean | null,
  dayReminderTimeRange?: Array< string | null > | null,
  dayReminderTimes?: Array< string | null > | null,
  deadlineAlarms?: Array< string | null > | null,
  ttl?: number | null,
  eventId?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateScheduleToDoInput = {
  id: string,
  taskId?: string | null,
  status?: Status | null,
  userId?: string | null,
  date?: string | null,
  dayFrequency?: number | null,
  frequency?: FREQUENCY | null,
  interval?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  byWeekDay?: Array< Day | null > | null,
  dayReminder?: boolean | null,
  dayReminderTimeRange?: Array< string | null > | null,
  dayReminderTimes?: Array< string | null > | null,
  deadlineAlarms?: Array< string | null > | null,
  ttl?: number | null,
  eventId?: string | null,
  _version?: number | null,
};

export type DeleteScheduleToDoInput = {
  id: string,
  _version?: number | null,
};

export type CreateMasterToDoInput = {
  id?: string | null,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type ModelMasterToDoConditionInput = {
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelMasterToDoConditionInput | null > | null,
  or?: Array< ModelMasterToDoConditionInput | null > | null,
  not?: ModelMasterToDoConditionInput | null,
};

export type MasterToDo = {
  __typename: "MasterToDo",
  id: string,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateMasterToDoInput = {
  id: string,
  userId?: string | null,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type DeleteMasterToDoInput = {
  id: string,
  _version?: number | null,
};

export type CreateWeeklyToDoInput = {
  id?: string | null,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type ModelWeeklyToDoConditionInput = {
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelWeeklyToDoConditionInput | null > | null,
  or?: Array< ModelWeeklyToDoConditionInput | null > | null,
  not?: ModelWeeklyToDoConditionInput | null,
};

export type WeeklyToDo = {
  __typename: "WeeklyToDo",
  id: string,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateWeeklyToDoInput = {
  id: string,
  userId?: string | null,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type DeleteWeeklyToDoInput = {
  id: string,
  _version?: number | null,
};

export type CreateGroceryToDoInput = {
  id?: string | null,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type ModelGroceryToDoConditionInput = {
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelGroceryToDoConditionInput | null > | null,
  or?: Array< ModelGroceryToDoConditionInput | null > | null,
  not?: ModelGroceryToDoConditionInput | null,
};

export type GroceryToDo = {
  __typename: "GroceryToDo",
  id: string,
  userId: string,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateGroceryToDoInput = {
  id: string,
  userId?: string | null,
  notes?: string | null,
  completed?: boolean | null,
  startDate?: string | null,
  endDate?: string | null,
  completedDate?: string | null,
  nextDay?: boolean | null,
  important?: boolean | null,
  date?: string | null,
  event?: boolean | null,
  scheduleId?: string | null,
  softDeadline?: string | null,
  hardDeadline?: string | null,
  recurring?: boolean | null,
  syncId?: string | null,
  syncName?: string | null,
  status?: ToDoStatus | null,
  parentId?: string | null,
  location?: string | null,
  tags?: Array< string | null > | null,
  heading?: string | null,
  order?: number | null,
  eventId?: string | null,
  duration?: number | null,
  _version?: number | null,
};

export type DeleteGroceryToDoInput = {
  id: string,
  _version?: number | null,
};

export type CreateScheduleInput = {
  id?: string | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  status: Status,
  userId: string,
  date: string,
  userIdGoal: string,
  unit?: string | null,
  ttl?: number | null,
  eventId?: string | null,
  _version?: number | null,
};

export type ModelScheduleConditionInput = {
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userIdGoal?: ModelStringInput | null,
  unit?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  and?: Array< ModelScheduleConditionInput | null > | null,
  or?: Array< ModelScheduleConditionInput | null > | null,
  not?: ModelScheduleConditionInput | null,
};

export type Schedule = {
  __typename: "Schedule",
  id: string,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  status: Status,
  userId: string,
  date: string,
  userIdGoal: string,
  unit?: string | null,
  ttl?: number | null,
  eventId?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateScheduleInput = {
  id: string,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  status?: Status | null,
  userId?: string | null,
  date?: string | null,
  userIdGoal?: string | null,
  unit?: string | null,
  ttl?: number | null,
  eventId?: string | null,
  _version?: number | null,
};

export type DeleteScheduleInput = {
  id: string,
  _version?: number | null,
};

export type CreateStreakInput = {
  id?: string | null,
  dataType?: string | null,
  goalId?: string | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  userIdGoal: string,
  userId: string,
  streak?: number | null,
  startDate: string,
  endDate?: string | null,
  lastSyncDate?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelStreakConditionInput = {
  dataType?: ModelStringInput | null,
  goalId?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userIdGoal?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  streak?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  lastSyncDate?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStreakConditionInput | null > | null,
  or?: Array< ModelStreakConditionInput | null > | null,
  not?: ModelStreakConditionInput | null,
};

export type Streak = {
  __typename: "Streak",
  id: string,
  dataType?: string | null,
  goalId?: string | null,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType?: string | null,
  userIdGoal: string,
  userId: string,
  streak?: number | null,
  startDate: string,
  endDate?: string | null,
  lastSyncDate?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  trainerId?: string | null,
};

export type UpdateStreakInput = {
  id: string,
  dataType?: string | null,
  goalId?: string | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  userIdGoal?: string | null,
  userId?: string | null,
  streak?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  lastSyncDate?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteStreakInput = {
  id: string,
  _version?: number | null,
};

export type CreateRoutineDataInput = {
  id?: string | null,
  userId: string,
  date: string,
  userIdType: string,
  type: string,
  rest?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelRoutineDataConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  type?: ModelStringInput | null,
  rest?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelRoutineDataConditionInput | null > | null,
  or?: Array< ModelRoutineDataConditionInput | null > | null,
  not?: ModelRoutineDataConditionInput | null,
};

export type RoutineData = {
  __typename: "RoutineData",
  id: string,
  userId: string,
  date: string,
  userIdType: string,
  type: string,
  rest?: number | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateRoutineDataInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  userIdType?: string | null,
  type?: string | null,
  rest?: number | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteRoutineDataInput = {
  id: string,
  _version?: number | null,
};

export type CreateUserActivateTypeInput = {
  id?: string | null,
  userId: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  activated: boolean,
  secondaryGoalName?: string | null,
  routineId?: string | null,
  exerciseId?: string | null,
  unit?: string | null,
  _version?: number | null,
};

export type ModelUserActivateTypeConditionInput = {
  userId?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  activated?: ModelBooleanInput | null,
  secondaryGoalName?: ModelStringInput | null,
  routineId?: ModelStringInput | null,
  exerciseId?: ModelStringInput | null,
  unit?: ModelStringInput | null,
  and?: Array< ModelUserActivateTypeConditionInput | null > | null,
  or?: Array< ModelUserActivateTypeConditionInput | null > | null,
  not?: ModelUserActivateTypeConditionInput | null,
};

export type UserActivateType = {
  __typename: "UserActivateType",
  id: string,
  userId: string,
  primaryGoalType: PrimaryGoalType,
  secondaryGoalType: string,
  activated: boolean,
  secondaryGoalName?: string | null,
  routineId?: string | null,
  exerciseId?: string | null,
  unit?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateUserActivateTypeInput = {
  id: string,
  userId?: string | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  activated?: boolean | null,
  secondaryGoalName?: string | null,
  routineId?: string | null,
  exerciseId?: string | null,
  unit?: string | null,
  _version?: number | null,
};

export type DeleteUserActivateTypeInput = {
  id: string,
  _version?: number | null,
};

export type CreateTagInput = {
  id?: string | null,
  name: string,
  _version?: number | null,
};

export type ModelTagConditionInput = {
  name?: ModelStringInput | null,
  and?: Array< ModelTagConditionInput | null > | null,
  or?: Array< ModelTagConditionInput | null > | null,
  not?: ModelTagConditionInput | null,
};

export type Tag = {
  __typename: "Tag",
  id: string,
  name: string,
  posts?: ModelPostTagConnection | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export type ModelPostTagConnection = {
  __typename: "ModelPostTagConnection",
  items:  Array<PostTag | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type PostTag = {
  __typename: "PostTag",
  id: string,
  tagID: string,
  postID: string,
  tag: Tag,
  post: Post,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export type Post = {
  __typename: "Post",
  id: string,
  dateDay: string,
  date: string,
  postUlid: string,
  caption?: string | null,
  tags?: ModelPostTagConnection | null,
  image?: string | null,
  userId: string,
  likes?: ModelPostLikeConnection | null,
  likeCount?: number | null,
  commentCount?: number | null,
  avatar?: string | null,
  username: string,
  profileId: string,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
};

export type ModelPostLikeConnection = {
  __typename: "ModelPostLikeConnection",
  items:  Array<PostLike | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type PostLike = {
  __typename: "PostLike",
  id: string,
  postId: string,
  userId: string,
  isLike?: boolean | null,
  username: string,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateTagInput = {
  id: string,
  name?: string | null,
  _version?: number | null,
};

export type DeleteTagInput = {
  id: string,
  _version?: number | null,
};

export type CreatePostInput = {
  id?: string | null,
  dateDay: string,
  date: string,
  postUlid: string,
  caption?: string | null,
  image?: string | null,
  userId: string,
  likeCount?: number | null,
  commentCount?: number | null,
  avatar?: string | null,
  username: string,
  profileId: string,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelPostConditionInput = {
  dateDay?: ModelIDInput | null,
  date?: ModelStringInput | null,
  postUlid?: ModelIDInput | null,
  caption?: ModelStringInput | null,
  image?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  likeCount?: ModelIntInput | null,
  commentCount?: ModelIntInput | null,
  avatar?: ModelStringInput | null,
  username?: ModelStringInput | null,
  profileId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelPostConditionInput | null > | null,
  or?: Array< ModelPostConditionInput | null > | null,
  not?: ModelPostConditionInput | null,
};

export type UpdatePostInput = {
  id: string,
  dateDay?: string | null,
  date?: string | null,
  postUlid?: string | null,
  caption?: string | null,
  image?: string | null,
  userId?: string | null,
  likeCount?: number | null,
  commentCount?: number | null,
  avatar?: string | null,
  username?: string | null,
  profileId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeletePostInput = {
  id: string,
  _version?: number | null,
};

export type CreatePostLikeInput = {
  id?: string | null,
  postId: string,
  userId: string,
  isLike?: boolean | null,
  username: string,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelPostLikeConditionInput = {
  postId?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  isLike?: ModelBooleanInput | null,
  username?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelPostLikeConditionInput | null > | null,
  or?: Array< ModelPostLikeConditionInput | null > | null,
  not?: ModelPostLikeConditionInput | null,
};

export type UpdatePostLikeInput = {
  id: string,
  postId?: string | null,
  userId?: string | null,
  isLike?: boolean | null,
  username?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeletePostLikeInput = {
  id: string,
  _version?: number | null,
};

export type CreateUserProfileInput = {
  id?: string | null,
  avatar?: string | null,
  username: string,
  email?: string | null,
  followerCount?: number | null,
  followingCount?: number | null,
  postCount?: number | null,
  bio?: string | null,
  userId: string,
  sub: string,
  pointId: string,
  dietSettingsId?: string | null,
  mealPreferencesId?: string | null,
  _version?: number | null,
};

export type ModelUserProfileConditionInput = {
  avatar?: ModelStringInput | null,
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  followerCount?: ModelIntInput | null,
  followingCount?: ModelIntInput | null,
  postCount?: ModelIntInput | null,
  bio?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  sub?: ModelIDInput | null,
  pointId?: ModelIDInput | null,
  dietSettingsId?: ModelIDInput | null,
  mealPreferencesId?: ModelIDInput | null,
  and?: Array< ModelUserProfileConditionInput | null > | null,
  or?: Array< ModelUserProfileConditionInput | null > | null,
  not?: ModelUserProfileConditionInput | null,
};

export type UserProfile = {
  __typename: "UserProfile",
  id: string,
  avatar?: string | null,
  username: string,
  email?: string | null,
  followerCount?: number | null,
  followingCount?: number | null,
  postCount?: number | null,
  bio?: string | null,
  userId: string,
  sub: string,
  Posts?: ModelPostConnection | null,
  pointId: string,
  dietSettingsId?: string | null,
  mealPreferencesId?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type ModelPostConnection = {
  __typename: "ModelPostConnection",
  items:  Array<Post | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type UpdateUserProfileInput = {
  id: string,
  avatar?: string | null,
  username?: string | null,
  email?: string | null,
  followerCount?: number | null,
  followingCount?: number | null,
  postCount?: number | null,
  bio?: string | null,
  userId?: string | null,
  sub?: string | null,
  pointId?: string | null,
  dietSettingsId?: string | null,
  mealPreferencesId?: string | null,
  _version?: number | null,
};

export type DeleteUserProfileInput = {
  id: string,
  _version?: number | null,
};

export type CreateSavedPostInput = {
  id?: string | null,
  userId: string,
  date: string,
  postId: string,
  _version?: number | null,
};

export type ModelSavedPostConditionInput = {
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  postId?: ModelIDInput | null,
  and?: Array< ModelSavedPostConditionInput | null > | null,
  or?: Array< ModelSavedPostConditionInput | null > | null,
  not?: ModelSavedPostConditionInput | null,
};

export type SavedPost = {
  __typename: "SavedPost",
  id: string,
  userId: string,
  date: string,
  postId: string,
  post?: Post | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateSavedPostInput = {
  id: string,
  userId?: string | null,
  date?: string | null,
  postId?: string | null,
  _version?: number | null,
};

export type DeleteSavedPostInput = {
  id: string,
  _version?: number | null,
};

export type CreateCommentInput = {
  id?: string | null,
  postId: string,
  date: string,
  content: string,
  userId: string,
  username: string,
  avatar?: string | null,
  profileId: string,
  replyId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type ModelCommentConditionInput = {
  postId?: ModelIDInput | null,
  date?: ModelIDInput | null,
  content?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  username?: ModelStringInput | null,
  avatar?: ModelStringInput | null,
  profileId?: ModelIDInput | null,
  replyId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelCommentConditionInput | null > | null,
  or?: Array< ModelCommentConditionInput | null > | null,
  not?: ModelCommentConditionInput | null,
};

export type Comment = {
  __typename: "Comment",
  id: string,
  postId: string,
  date: string,
  content: string,
  userId: string,
  username: string,
  avatar?: string | null,
  profileId: string,
  replyId?: string | null,
  ttl?: number | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateCommentInput = {
  id: string,
  postId?: string | null,
  date?: string | null,
  content?: string | null,
  userId?: string | null,
  username?: string | null,
  avatar?: string | null,
  profileId?: string | null,
  replyId?: string | null,
  ttl?: number | null,
  _version?: number | null,
};

export type DeleteCommentInput = {
  id: string,
  _version?: number | null,
};

export type CreateIntegrationInput = {
  id?: string | null,
  sub: string,
  token?: string | null,
  resource?: string | null,
  resourceId?: string | null,
  name?: string | null,
  tableName?: string | null,
  _version?: number | null,
};

export type ModelIntegrationConditionInput = {
  sub?: ModelIDInput | null,
  token?: ModelStringInput | null,
  resource?: ModelStringInput | null,
  resourceId?: ModelStringInput | null,
  name?: ModelStringInput | null,
  tableName?: ModelStringInput | null,
  and?: Array< ModelIntegrationConditionInput | null > | null,
  or?: Array< ModelIntegrationConditionInput | null > | null,
  not?: ModelIntegrationConditionInput | null,
};

export type Integration = {
  __typename: "Integration",
  id: string,
  sub: string,
  token?: string | null,
  resource?: string | null,
  resourceId?: string | null,
  name?: string | null,
  tableName?: string | null,
  createdAt: string,
  updatedAt: string,
  _version: number,
  _deleted?: boolean | null,
  _lastChangedAt: number,
  owner?: string | null,
};

export type UpdateIntegrationInput = {
  id: string,
  sub?: string | null,
  token?: string | null,
  resource?: string | null,
  resourceId?: string | null,
  name?: string | null,
  tableName?: string | null,
  _version?: number | null,
};

export type DeleteIntegrationInput = {
  id: string,
  _version?: number | null,
};

export type CreatePostTagInput = {
  id?: string | null,
  tagID: string,
  postID: string,
  _version?: number | null,
};

export type ModelPostTagConditionInput = {
  tagID?: ModelIDInput | null,
  postID?: ModelIDInput | null,
  and?: Array< ModelPostTagConditionInput | null > | null,
  or?: Array< ModelPostTagConditionInput | null > | null,
  not?: ModelPostTagConditionInput | null,
};

export type UpdatePostTagInput = {
  id: string,
  tagID?: string | null,
  postID?: string | null,
  _version?: number | null,
};

export type DeletePostTagInput = {
  id: string,
  _version?: number | null,
};

export type ModelActivityFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  senderId?: ModelIDInput | null,
  activity?: ModelActivityTypeInput | null,
  objectId?: ModelIDInput | null,
  sendername?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelActivityFilterInput | null > | null,
  or?: Array< ModelActivityFilterInput | null > | null,
  not?: ModelActivityFilterInput | null,
};

export type ModelActivityConnection = {
  __typename: "ModelActivityConnection",
  items:  Array<Activity | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelStringKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelIDKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export type ModelFollowerFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  followerProfileId?: ModelIDInput | null,
  avatar?: ModelStringInput | null,
  isFollower?: ModelBooleanInput | null,
  username?: ModelStringInput | null,
  and?: Array< ModelFollowerFilterInput | null > | null,
  or?: Array< ModelFollowerFilterInput | null > | null,
  not?: ModelFollowerFilterInput | null,
};

export type ModelFollowerConnection = {
  __typename: "ModelFollowerConnection",
  items:  Array<Follower | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelFollowingFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  followingProfileId?: ModelIDInput | null,
  username?: ModelStringInput | null,
  avatar?: ModelStringInput | null,
  isFollowing?: ModelBooleanInput | null,
  and?: Array< ModelFollowingFilterInput | null > | null,
  or?: Array< ModelFollowingFilterInput | null > | null,
  not?: ModelFollowingFilterInput | null,
};

export type ModelFollowingConnection = {
  __typename: "ModelFollowingConnection",
  items:  Array<Following | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  profileId?: ModelIDInput | null,
  sub?: ModelIDInput | null,
  email?: ModelStringInput | null,
  phoneNumber?: ModelStringInput | null,
  name?: ModelStringInput | null,
  customerId?: ModelStringInput | null,
  timezone?: ModelStringInput | null,
  onboard?: ModelBooleanInput | null,
  pushToken?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelGoalFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  endDate?: ModelStringInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  goal?: ModelStringInput | null,
  goalUnit?: ModelStringInput | null,
  previousWeek?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelGoalFilterInput | null > | null,
  or?: Array< ModelGoalFilterInput | null > | null,
  not?: ModelGoalFilterInput | null,
};

export type ModelGoalConnection = {
  __typename: "ModelGoalConnection",
  items:  Array<Goal | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelGoalByUserByDateCompositeKeyConditionInput = {
  eq?: ModelGoalByUserByDateCompositeKeyInput | null,
  le?: ModelGoalByUserByDateCompositeKeyInput | null,
  lt?: ModelGoalByUserByDateCompositeKeyInput | null,
  ge?: ModelGoalByUserByDateCompositeKeyInput | null,
  gt?: ModelGoalByUserByDateCompositeKeyInput | null,
  between?: Array< ModelGoalByUserByDateCompositeKeyInput | null > | null,
  beginsWith?: ModelGoalByUserByDateCompositeKeyInput | null,
};

export type ModelGoalByUserByDateCompositeKeyInput = {
  date?: string | null,
  status?: Status | null,
  primaryGoalType?: PrimaryGoalType | null,
};

export type ModelGoalExerciseFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  endDate?: ModelStringInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  goal?: ModelStringInput | null,
  goalUnit?: ModelExerciseGoalPreferenceInput | null,
  previousWeek?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelGoalExerciseFilterInput | null > | null,
  or?: Array< ModelGoalExerciseFilterInput | null > | null,
  not?: ModelGoalExerciseFilterInput | null,
};

export type ModelGoalExerciseConnection = {
  __typename: "ModelGoalExerciseConnection",
  items:  Array<GoalExercise | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelGoalExerciseByUserByDateCompositeKeyConditionInput = {
  eq?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
  le?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
  lt?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
  ge?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
  gt?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
  between?: Array< ModelGoalExerciseByUserByDateCompositeKeyInput | null > | null,
  beginsWith?: ModelGoalExerciseByUserByDateCompositeKeyInput | null,
};

export type ModelGoalExerciseByUserByDateCompositeKeyInput = {
  date?: string | null,
  status?: Status | null,
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
};

export type ModelStepDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  steps?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStepDataFilterInput | null > | null,
  or?: Array< ModelStepDataFilterInput | null > | null,
  not?: ModelStepDataFilterInput | null,
};

export type ModelStepDataConnection = {
  __typename: "ModelStepDataConnection",
  items:  Array<StepData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelStrengthDataFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  date?: ModelStringInput | null,
  weight?: ModelFloatInput | null,
  weightUnit?: ModelStringInput | null,
  reps?: ModelFloatInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStrengthDataFilterInput | null > | null,
  or?: Array< ModelStrengthDataFilterInput | null > | null,
  not?: ModelStrengthDataFilterInput | null,
};

export type ModelStrengthDataConnection = {
  __typename: "ModelStrengthDataConnection",
  items:  Array<StrengthData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelEnduranceDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  minutes?: ModelFloatInput | null,
  reps?: ModelFloatInput | null,
  type?: ModelStringInput | null,
  distance?: ModelFloatInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelEnduranceDataFilterInput | null > | null,
  or?: Array< ModelEnduranceDataFilterInput | null > | null,
  not?: ModelEnduranceDataFilterInput | null,
};

export type ModelEnduranceDataConnection = {
  __typename: "ModelEnduranceDataConnection",
  items:  Array<EnduranceData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelWeightDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  weight?: ModelFloatInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelWeightDataFilterInput | null > | null,
  or?: Array< ModelWeightDataFilterInput | null > | null,
  not?: ModelWeightDataFilterInput | null,
};

export type ModelWeightDataConnection = {
  __typename: "ModelWeightDataConnection",
  items:  Array<WeightData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelNewSkillTypeDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelNewSkillTypeDataFilterInput | null > | null,
  or?: Array< ModelNewSkillTypeDataFilterInput | null > | null,
  not?: ModelNewSkillTypeDataFilterInput | null,
};

export type ModelNewSkillTypeDataConnection = {
  __typename: "ModelNewSkillTypeDataConnection",
  items:  Array<NewSkillTypeData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelHabitTypeDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelHabitTypeDataFilterInput | null > | null,
  or?: Array< ModelHabitTypeDataFilterInput | null > | null,
  not?: ModelHabitTypeDataFilterInput | null,
};

export type ModelHabitTypeDataConnection = {
  __typename: "ModelHabitTypeDataConnection",
  items:  Array<HabitTypeData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelLimitTypeDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  unit?: ModelStringInput | null,
  type?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelLimitTypeDataFilterInput | null > | null,
  or?: Array< ModelLimitTypeDataFilterInput | null > | null,
  not?: ModelLimitTypeDataFilterInput | null,
};

export type ModelLimitTypeDataConnection = {
  __typename: "ModelLimitTypeDataConnection",
  items:  Array<LimitTypeData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelMeditationDataFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  minutes?: ModelFloatInput | null,
  scheduleId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelMeditationDataFilterInput | null > | null,
  or?: Array< ModelMeditationDataFilterInput | null > | null,
  not?: ModelMeditationDataFilterInput | null,
};

export type ModelMeditationDataConnection = {
  __typename: "ModelMeditationDataConnection",
  items:  Array<MeditationData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelLevelFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  level?: ModelIntInput | null,
  attempts?: ModelIntInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  date?: ModelStringInput | null,
  and?: Array< ModelLevelFilterInput | null > | null,
  or?: Array< ModelLevelFilterInput | null > | null,
  not?: ModelLevelFilterInput | null,
};

export type ModelLevelConnection = {
  __typename: "ModelLevelConnection",
  items:  Array<Level | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelLevelByUserByGoalTypeCompositeKeyConditionInput = {
  eq?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
  le?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
  lt?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
  ge?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
  gt?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
  between?: Array< ModelLevelByUserByGoalTypeCompositeKeyInput | null > | null,
  beginsWith?: ModelLevelByUserByGoalTypeCompositeKeyInput | null,
};

export type ModelLevelByUserByGoalTypeCompositeKeyInput = {
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
  date?: string | null,
};

export type ModelPointFilterInput = {
  id?: ModelIDInput | null,
  points?: ModelIntInput | null,
  currentPoints?: ModelIntInput | null,
  max?: ModelIntInput | null,
  min?: ModelIntInput | null,
  maxDate?: ModelStringInput | null,
  minDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  and?: Array< ModelPointFilterInput | null > | null,
  or?: Array< ModelPointFilterInput | null > | null,
  not?: ModelPointFilterInput | null,
};

export type ModelPointConnection = {
  __typename: "ModelPointConnection",
  items:  Array<Point | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserStatFilterInput = {
  id?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  value?: ModelFloatInput | null,
  currentValue?: ModelFloatInput | null,
  max?: ModelFloatInput | null,
  min?: ModelFloatInput | null,
  maxDate?: ModelStringInput | null,
  minDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  lastStreakStartDate?: ModelStringInput | null,
  lastStreakEndDate?: ModelStringInput | null,
  lastStreakValue?: ModelIntInput | null,
  bestStreakStartDate?: ModelStringInput | null,
  bestStreakEndDate?: ModelStringInput | null,
  bestStreakValue?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelUserStatFilterInput | null > | null,
  or?: Array< ModelUserStatFilterInput | null > | null,
  not?: ModelUserStatFilterInput | null,
};

export type ModelUserStatConnection = {
  __typename: "ModelUserStatConnection",
  items:  Array<UserStat | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelRoutineFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelIDInput | null,
  nId?: ModelIDInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelRoutineFilterInput | null > | null,
  or?: Array< ModelRoutineFilterInput | null > | null,
  not?: ModelRoutineFilterInput | null,
};

export type ModelRoutineConnection = {
  __typename: "ModelRoutineConnection",
  items:  Array<Routine | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelExerciseFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelIDInput | null,
  nId?: ModelIDInput | null,
  type?: ModelExerciseTypeInput | null,
  description?: ModelStringInput | null,
  and?: Array< ModelExerciseFilterInput | null > | null,
  or?: Array< ModelExerciseFilterInput | null > | null,
  not?: ModelExerciseFilterInput | null,
};

export type ModelExerciseConnection = {
  __typename: "ModelExerciseConnection",
  items:  Array<Exercise | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserExerciseStatFilterInput = {
  id?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  repsValue?: ModelFloatInput | null,
  minutesValue?: ModelFloatInput | null,
  weightValue?: ModelFloatInput | null,
  distanceValue?: ModelFloatInput | null,
  currentRepsValue?: ModelFloatInput | null,
  currentMinutesValue?: ModelFloatInput | null,
  currentDistanceValue?: ModelFloatInput | null,
  currentWeightValue?: ModelFloatInput | null,
  maxReps?: ModelFloatInput | null,
  minReps?: ModelFloatInput | null,
  maxRepsDate?: ModelStringInput | null,
  minRepsDate?: ModelStringInput | null,
  maxMinutes?: ModelFloatInput | null,
  minMinutes?: ModelFloatInput | null,
  maxMinutesDate?: ModelStringInput | null,
  minMinutesDate?: ModelStringInput | null,
  maxWeight?: ModelFloatInput | null,
  minWeight?: ModelFloatInput | null,
  maxWeightDate?: ModelStringInput | null,
  minWeightDate?: ModelStringInput | null,
  maxDistance?: ModelFloatInput | null,
  minDistance?: ModelFloatInput | null,
  maxDistanceDate?: ModelStringInput | null,
  minDistanceDate?: ModelStringInput | null,
  currentDate?: ModelStringInput | null,
  dayCount?: ModelIntInput | null,
  unit?: ModelStringInput | null,
  statPreference?: ModelStatPreferenceInput | null,
  lastStreakStartDate?: ModelStringInput | null,
  lastStreakEndDate?: ModelStringInput | null,
  lastStreakValue?: ModelIntInput | null,
  bestStreakStartDate?: ModelStringInput | null,
  bestStreakEndDate?: ModelStringInput | null,
  bestStreakValue?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelUserExerciseStatFilterInput | null > | null,
  or?: Array< ModelUserExerciseStatFilterInput | null > | null,
  not?: ModelUserExerciseStatFilterInput | null,
};

export type ModelUserExerciseStatConnection = {
  __typename: "ModelUserExerciseStatConnection",
  items:  Array<UserExerciseStat | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyConditionInput = {
  eq?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
  le?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
  lt?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
  ge?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
  gt?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
  between?: Array< ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null > | null,
  beginsWith?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput | null,
};

export type ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyInput = {
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
};

export type ModelDailyToDoFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelDailyToDoFilterInput | null > | null,
  or?: Array< ModelDailyToDoFilterInput | null > | null,
  not?: ModelDailyToDoFilterInput | null,
};

export type ModelDailyToDoConnection = {
  __typename: "ModelDailyToDoConnection",
  items:  Array<DailyToDo | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelScheduleToDoFilterInput = {
  id?: ModelIDInput | null,
  taskId?: ModelIDInput | null,
  status?: ModelStatusInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  dayFrequency?: ModelIntInput | null,
  frequency?: ModelFREQUENCYInput | null,
  interval?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  byWeekDay?: ModelDayListInput | null,
  dayReminder?: ModelBooleanInput | null,
  dayReminderTimeRange?: ModelStringInput | null,
  dayReminderTimes?: ModelStringInput | null,
  deadlineAlarms?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  and?: Array< ModelScheduleToDoFilterInput | null > | null,
  or?: Array< ModelScheduleToDoFilterInput | null > | null,
  not?: ModelScheduleToDoFilterInput | null,
};

export type ModelScheduleToDoConnection = {
  __typename: "ModelScheduleToDoConnection",
  items:  Array<ScheduleToDo | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelScheduleToDoByUserByDateCompositeKeyConditionInput = {
  eq?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
  le?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
  lt?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
  ge?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
  gt?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
  between?: Array< ModelScheduleToDoByUserByDateCompositeKeyInput | null > | null,
  beginsWith?: ModelScheduleToDoByUserByDateCompositeKeyInput | null,
};

export type ModelScheduleToDoByUserByDateCompositeKeyInput = {
  date?: string | null,
  status?: Status | null,
};

export type ModelMasterToDoFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelMasterToDoFilterInput | null > | null,
  or?: Array< ModelMasterToDoFilterInput | null > | null,
  not?: ModelMasterToDoFilterInput | null,
};

export type ModelMasterToDoConnection = {
  __typename: "ModelMasterToDoConnection",
  items:  Array<MasterToDo | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelWeeklyToDoFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelWeeklyToDoFilterInput | null > | null,
  or?: Array< ModelWeeklyToDoFilterInput | null > | null,
  not?: ModelWeeklyToDoFilterInput | null,
};

export type ModelWeeklyToDoConnection = {
  __typename: "ModelWeeklyToDoConnection",
  items:  Array<WeeklyToDo | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelGroceryToDoFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  notes?: ModelStringInput | null,
  completed?: ModelBooleanInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  completedDate?: ModelStringInput | null,
  nextDay?: ModelBooleanInput | null,
  important?: ModelBooleanInput | null,
  date?: ModelStringInput | null,
  event?: ModelBooleanInput | null,
  scheduleId?: ModelIDInput | null,
  softDeadline?: ModelStringInput | null,
  hardDeadline?: ModelStringInput | null,
  recurring?: ModelBooleanInput | null,
  syncId?: ModelIDInput | null,
  syncName?: ModelStringInput | null,
  status?: ModelToDoStatusInput | null,
  parentId?: ModelIDInput | null,
  location?: ModelStringInput | null,
  tags?: ModelStringInput | null,
  heading?: ModelStringInput | null,
  order?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  duration?: ModelIntInput | null,
  and?: Array< ModelGroceryToDoFilterInput | null > | null,
  or?: Array< ModelGroceryToDoFilterInput | null > | null,
  not?: ModelGroceryToDoFilterInput | null,
};

export type ModelGroceryToDoConnection = {
  __typename: "ModelGroceryToDoConnection",
  items:  Array<GroceryToDo | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelScheduleFilterInput = {
  id?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  status?: ModelStatusInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userIdGoal?: ModelStringInput | null,
  unit?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  eventId?: ModelIDInput | null,
  and?: Array< ModelScheduleFilterInput | null > | null,
  or?: Array< ModelScheduleFilterInput | null > | null,
  not?: ModelScheduleFilterInput | null,
};

export type ModelScheduleConnection = {
  __typename: "ModelScheduleConnection",
  items:  Array<Schedule | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelStreakFilterInput = {
  id?: ModelIDInput | null,
  dataType?: ModelStringInput | null,
  goalId?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  userIdGoal?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  streak?: ModelIntInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  lastSyncDate?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelStreakFilterInput | null > | null,
  or?: Array< ModelStreakFilterInput | null > | null,
  not?: ModelStreakFilterInput | null,
};

export type ModelStreakConnection = {
  __typename: "ModelStreakConnection",
  items:  Array<Streak | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelRoutineDataFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  userIdType?: ModelStringInput | null,
  type?: ModelStringInput | null,
  rest?: ModelIntInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelRoutineDataFilterInput | null > | null,
  or?: Array< ModelRoutineDataFilterInput | null > | null,
  not?: ModelRoutineDataFilterInput | null,
};

export type ModelRoutineDataConnection = {
  __typename: "ModelRoutineDataConnection",
  items:  Array<RoutineData | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserActivateTypeFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  primaryGoalType?: ModelPrimaryGoalTypeInput | null,
  secondaryGoalType?: ModelStringInput | null,
  activated?: ModelBooleanInput | null,
  secondaryGoalName?: ModelStringInput | null,
  routineId?: ModelStringInput | null,
  exerciseId?: ModelStringInput | null,
  unit?: ModelStringInput | null,
  and?: Array< ModelUserActivateTypeFilterInput | null > | null,
  or?: Array< ModelUserActivateTypeFilterInput | null > | null,
  not?: ModelUserActivateTypeFilterInput | null,
};

export type ModelUserActivateTypeConnection = {
  __typename: "ModelUserActivateTypeConnection",
  items:  Array<UserActivateType | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelUserActivateTypeByUserByGoalTypeCompositeKeyConditionInput = {
  eq?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
  le?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
  lt?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
  ge?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
  gt?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
  between?: Array< ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null > | null,
  beginsWith?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput | null,
};

export type ModelUserActivateTypeByUserByGoalTypeCompositeKeyInput = {
  primaryGoalType?: PrimaryGoalType | null,
  secondaryGoalType?: string | null,
};

export type ModelTagFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  and?: Array< ModelTagFilterInput | null > | null,
  or?: Array< ModelTagFilterInput | null > | null,
  not?: ModelTagFilterInput | null,
};

export type ModelTagConnection = {
  __typename: "ModelTagConnection",
  items:  Array<Tag | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelPostFilterInput = {
  id?: ModelIDInput | null,
  dateDay?: ModelIDInput | null,
  date?: ModelStringInput | null,
  postUlid?: ModelIDInput | null,
  caption?: ModelStringInput | null,
  image?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  likeCount?: ModelIntInput | null,
  commentCount?: ModelIntInput | null,
  avatar?: ModelStringInput | null,
  username?: ModelStringInput | null,
  profileId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelPostFilterInput | null > | null,
  or?: Array< ModelPostFilterInput | null > | null,
  not?: ModelPostFilterInput | null,
};

export type ModelPostLikeFilterInput = {
  id?: ModelIDInput | null,
  postId?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  isLike?: ModelBooleanInput | null,
  username?: ModelStringInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelPostLikeFilterInput | null > | null,
  or?: Array< ModelPostLikeFilterInput | null > | null,
  not?: ModelPostLikeFilterInput | null,
};

export type ModelUserProfileFilterInput = {
  id?: ModelIDInput | null,
  avatar?: ModelStringInput | null,
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  followerCount?: ModelIntInput | null,
  followingCount?: ModelIntInput | null,
  postCount?: ModelIntInput | null,
  bio?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  sub?: ModelIDInput | null,
  pointId?: ModelIDInput | null,
  dietSettingsId?: ModelIDInput | null,
  mealPreferencesId?: ModelIDInput | null,
  and?: Array< ModelUserProfileFilterInput | null > | null,
  or?: Array< ModelUserProfileFilterInput | null > | null,
  not?: ModelUserProfileFilterInput | null,
};

export type ModelUserProfileConnection = {
  __typename: "ModelUserProfileConnection",
  items:  Array<UserProfile | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelSavedPostFilterInput = {
  id?: ModelIDInput | null,
  userId?: ModelIDInput | null,
  date?: ModelStringInput | null,
  postId?: ModelIDInput | null,
  and?: Array< ModelSavedPostFilterInput | null > | null,
  or?: Array< ModelSavedPostFilterInput | null > | null,
  not?: ModelSavedPostFilterInput | null,
};

export type ModelSavedPostConnection = {
  __typename: "ModelSavedPostConnection",
  items:  Array<SavedPost | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelCommentFilterInput = {
  id?: ModelIDInput | null,
  postId?: ModelIDInput | null,
  date?: ModelIDInput | null,
  content?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  username?: ModelStringInput | null,
  avatar?: ModelStringInput | null,
  profileId?: ModelIDInput | null,
  replyId?: ModelIDInput | null,
  ttl?: ModelIntInput | null,
  and?: Array< ModelCommentFilterInput | null > | null,
  or?: Array< ModelCommentFilterInput | null > | null,
  not?: ModelCommentFilterInput | null,
};

export type ModelCommentConnection = {
  __typename: "ModelCommentConnection",
  items:  Array<Comment | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelCommentByPostCompositeKeyConditionInput = {
  eq?: ModelCommentByPostCompositeKeyInput | null,
  le?: ModelCommentByPostCompositeKeyInput | null,
  lt?: ModelCommentByPostCompositeKeyInput | null,
  ge?: ModelCommentByPostCompositeKeyInput | null,
  gt?: ModelCommentByPostCompositeKeyInput | null,
  between?: Array< ModelCommentByPostCompositeKeyInput | null > | null,
  beginsWith?: ModelCommentByPostCompositeKeyInput | null,
};

export type ModelCommentByPostCompositeKeyInput = {
  date?: string | null,
  id?: string | null,
};

export type ModelIntegrationFilterInput = {
  id?: ModelIDInput | null,
  sub?: ModelIDInput | null,
  token?: ModelStringInput | null,
  resource?: ModelStringInput | null,
  resourceId?: ModelStringInput | null,
  name?: ModelStringInput | null,
  tableName?: ModelStringInput | null,
  and?: Array< ModelIntegrationFilterInput | null > | null,
  or?: Array< ModelIntegrationFilterInput | null > | null,
  not?: ModelIntegrationFilterInput | null,
};

export type ModelIntegrationConnection = {
  __typename: "ModelIntegrationConnection",
  items:  Array<Integration | null >,
  nextToken?: string | null,
  startedAt?: number | null,
};

export type ModelPostTagFilterInput = {
  id?: ModelIDInput | null,
  tagID?: ModelIDInput | null,
  postID?: ModelIDInput | null,
  and?: Array< ModelPostTagFilterInput | null > | null,
  or?: Array< ModelPostTagFilterInput | null > | null,
  not?: ModelPostTagFilterInput | null,
};

export type CreateActivityMutationVariables = {
  input: CreateActivityInput,
  condition?: ModelActivityConditionInput | null,
};

export type CreateActivityMutation = {
  createActivity?:  {
    __typename: "Activity",
    id: string,
    userId: string,
    date: string,
    senderId: string,
    activity: ActivityType,
    objectId?: string | null,
    sendername: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateActivityMutationVariables = {
  input: UpdateActivityInput,
  condition?: ModelActivityConditionInput | null,
};

export type UpdateActivityMutation = {
  updateActivity?:  {
    __typename: "Activity",
    id: string,
    userId: string,
    date: string,
    senderId: string,
    activity: ActivityType,
    objectId?: string | null,
    sendername: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteActivityMutationVariables = {
  input: DeleteActivityInput,
  condition?: ModelActivityConditionInput | null,
};

export type DeleteActivityMutation = {
  deleteActivity?:  {
    __typename: "Activity",
    id: string,
    userId: string,
    date: string,
    senderId: string,
    activity: ActivityType,
    objectId?: string | null,
    sendername: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateFollowerMutationVariables = {
  input: CreateFollowerInput,
  condition?: ModelFollowerConditionInput | null,
};

export type CreateFollowerMutation = {
  createFollower?:  {
    __typename: "Follower",
    id: string,
    userId: string,
    followerProfileId: string,
    avatar?: string | null,
    isFollower?: boolean | null,
    username: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateFollowerMutationVariables = {
  input: UpdateFollowerInput,
  condition?: ModelFollowerConditionInput | null,
};

export type UpdateFollowerMutation = {
  updateFollower?:  {
    __typename: "Follower",
    id: string,
    userId: string,
    followerProfileId: string,
    avatar?: string | null,
    isFollower?: boolean | null,
    username: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteFollowerMutationVariables = {
  input: DeleteFollowerInput,
  condition?: ModelFollowerConditionInput | null,
};

export type DeleteFollowerMutation = {
  deleteFollower?:  {
    __typename: "Follower",
    id: string,
    userId: string,
    followerProfileId: string,
    avatar?: string | null,
    isFollower?: boolean | null,
    username: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateFollowingMutationVariables = {
  input: CreateFollowingInput,
  condition?: ModelFollowingConditionInput | null,
};

export type CreateFollowingMutation = {
  createFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateFollowingMutationVariables = {
  input: UpdateFollowingInput,
  condition?: ModelFollowingConditionInput | null,
};

export type UpdateFollowingMutation = {
  updateFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteFollowingMutationVariables = {
  input: DeleteFollowingInput,
  condition?: ModelFollowingConditionInput | null,
};

export type DeleteFollowingMutation = {
  deleteFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateGoalMutationVariables = {
  input: CreateGoalInput,
  condition?: ModelGoalConditionInput | null,
};

export type CreateGoalMutation = {
  createGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateGoalMutationVariables = {
  input: UpdateGoalInput,
  condition?: ModelGoalConditionInput | null,
};

export type UpdateGoalMutation = {
  updateGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteGoalMutationVariables = {
  input: DeleteGoalInput,
  condition?: ModelGoalConditionInput | null,
};

export type DeleteGoalMutation = {
  deleteGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateGoalExerciseMutationVariables = {
  input: CreateGoalExerciseInput,
  condition?: ModelGoalExerciseConditionInput | null,
};

export type CreateGoalExerciseMutation = {
  createGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateGoalExerciseMutationVariables = {
  input: UpdateGoalExerciseInput,
  condition?: ModelGoalExerciseConditionInput | null,
};

export type UpdateGoalExerciseMutation = {
  updateGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteGoalExerciseMutationVariables = {
  input: DeleteGoalExerciseInput,
  condition?: ModelGoalExerciseConditionInput | null,
};

export type DeleteGoalExerciseMutation = {
  deleteGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateStepDataMutationVariables = {
  input: CreateStepDataInput,
  condition?: ModelStepDataConditionInput | null,
};

export type CreateStepDataMutation = {
  createStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateStepDataMutationVariables = {
  input: UpdateStepDataInput,
  condition?: ModelStepDataConditionInput | null,
};

export type UpdateStepDataMutation = {
  updateStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteStepDataMutationVariables = {
  input: DeleteStepDataInput,
  condition?: ModelStepDataConditionInput | null,
};

export type DeleteStepDataMutation = {
  deleteStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateStrengthDataMutationVariables = {
  input: CreateStrengthDataInput,
  condition?: ModelStrengthDataConditionInput | null,
};

export type CreateStrengthDataMutation = {
  createStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateStrengthDataMutationVariables = {
  input: UpdateStrengthDataInput,
  condition?: ModelStrengthDataConditionInput | null,
};

export type UpdateStrengthDataMutation = {
  updateStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteStrengthDataMutationVariables = {
  input: DeleteStrengthDataInput,
  condition?: ModelStrengthDataConditionInput | null,
};

export type DeleteStrengthDataMutation = {
  deleteStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateEnduranceDataMutationVariables = {
  input: CreateEnduranceDataInput,
  condition?: ModelEnduranceDataConditionInput | null,
};

export type CreateEnduranceDataMutation = {
  createEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateEnduranceDataMutationVariables = {
  input: UpdateEnduranceDataInput,
  condition?: ModelEnduranceDataConditionInput | null,
};

export type UpdateEnduranceDataMutation = {
  updateEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteEnduranceDataMutationVariables = {
  input: DeleteEnduranceDataInput,
  condition?: ModelEnduranceDataConditionInput | null,
};

export type DeleteEnduranceDataMutation = {
  deleteEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateWeightDataMutationVariables = {
  input: CreateWeightDataInput,
  condition?: ModelWeightDataConditionInput | null,
};

export type CreateWeightDataMutation = {
  createWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateWeightDataMutationVariables = {
  input: UpdateWeightDataInput,
  condition?: ModelWeightDataConditionInput | null,
};

export type UpdateWeightDataMutation = {
  updateWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteWeightDataMutationVariables = {
  input: DeleteWeightDataInput,
  condition?: ModelWeightDataConditionInput | null,
};

export type DeleteWeightDataMutation = {
  deleteWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateNewSkillTypeDataMutationVariables = {
  input: CreateNewSkillTypeDataInput,
  condition?: ModelNewSkillTypeDataConditionInput | null,
};

export type CreateNewSkillTypeDataMutation = {
  createNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateNewSkillTypeDataMutationVariables = {
  input: UpdateNewSkillTypeDataInput,
  condition?: ModelNewSkillTypeDataConditionInput | null,
};

export type UpdateNewSkillTypeDataMutation = {
  updateNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteNewSkillTypeDataMutationVariables = {
  input: DeleteNewSkillTypeDataInput,
  condition?: ModelNewSkillTypeDataConditionInput | null,
};

export type DeleteNewSkillTypeDataMutation = {
  deleteNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateHabitTypeDataMutationVariables = {
  input: CreateHabitTypeDataInput,
  condition?: ModelHabitTypeDataConditionInput | null,
};

export type CreateHabitTypeDataMutation = {
  createHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateHabitTypeDataMutationVariables = {
  input: UpdateHabitTypeDataInput,
  condition?: ModelHabitTypeDataConditionInput | null,
};

export type UpdateHabitTypeDataMutation = {
  updateHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteHabitTypeDataMutationVariables = {
  input: DeleteHabitTypeDataInput,
  condition?: ModelHabitTypeDataConditionInput | null,
};

export type DeleteHabitTypeDataMutation = {
  deleteHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateLimitTypeDataMutationVariables = {
  input: CreateLimitTypeDataInput,
  condition?: ModelLimitTypeDataConditionInput | null,
};

export type CreateLimitTypeDataMutation = {
  createLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateLimitTypeDataMutationVariables = {
  input: UpdateLimitTypeDataInput,
  condition?: ModelLimitTypeDataConditionInput | null,
};

export type UpdateLimitTypeDataMutation = {
  updateLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteLimitTypeDataMutationVariables = {
  input: DeleteLimitTypeDataInput,
  condition?: ModelLimitTypeDataConditionInput | null,
};

export type DeleteLimitTypeDataMutation = {
  deleteLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateMeditationDataMutationVariables = {
  input: CreateMeditationDataInput,
  condition?: ModelMeditationDataConditionInput | null,
};

export type CreateMeditationDataMutation = {
  createMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateMeditationDataMutationVariables = {
  input: UpdateMeditationDataInput,
  condition?: ModelMeditationDataConditionInput | null,
};

export type UpdateMeditationDataMutation = {
  updateMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteMeditationDataMutationVariables = {
  input: DeleteMeditationDataInput,
  condition?: ModelMeditationDataConditionInput | null,
};

export type DeleteMeditationDataMutation = {
  deleteMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateLevelMutationVariables = {
  input: CreateLevelInput,
  condition?: ModelLevelConditionInput | null,
};

export type CreateLevelMutation = {
  createLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateLevelMutationVariables = {
  input: UpdateLevelInput,
  condition?: ModelLevelConditionInput | null,
};

export type UpdateLevelMutation = {
  updateLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteLevelMutationVariables = {
  input: DeleteLevelInput,
  condition?: ModelLevelConditionInput | null,
};

export type DeleteLevelMutation = {
  deleteLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreatePointMutationVariables = {
  input: CreatePointInput,
  condition?: ModelPointConditionInput | null,
};

export type CreatePointMutation = {
  createPoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdatePointMutationVariables = {
  input: UpdatePointInput,
  condition?: ModelPointConditionInput | null,
};

export type UpdatePointMutation = {
  updatePoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeletePointMutationVariables = {
  input: DeletePointInput,
  condition?: ModelPointConditionInput | null,
};

export type DeletePointMutation = {
  deletePoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateUserStatMutationVariables = {
  input: CreateUserStatInput,
  condition?: ModelUserStatConditionInput | null,
};

export type CreateUserStatMutation = {
  createUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateUserStatMutationVariables = {
  input: UpdateUserStatInput,
  condition?: ModelUserStatConditionInput | null,
};

export type UpdateUserStatMutation = {
  updateUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteUserStatMutationVariables = {
  input: DeleteUserStatInput,
  condition?: ModelUserStatConditionInput | null,
};

export type DeleteUserStatMutation = {
  deleteUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateExerciseRoutineMutationVariables = {
  input: CreateExerciseRoutineInput,
  condition?: ModelExerciseRoutineConditionInput | null,
};

export type CreateExerciseRoutineMutation = {
  createExerciseRoutine?:  {
    __typename: "ExerciseRoutine",
    id: string,
    routineId: string,
    exerciseId: string,
    routine?:  {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    exercise?:  {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdateExerciseRoutineMutationVariables = {
  input: UpdateExerciseRoutineInput,
  condition?: ModelExerciseRoutineConditionInput | null,
};

export type UpdateExerciseRoutineMutation = {
  updateExerciseRoutine?:  {
    __typename: "ExerciseRoutine",
    id: string,
    routineId: string,
    exerciseId: string,
    routine?:  {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    exercise?:  {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeleteExerciseRoutineMutationVariables = {
  input: DeleteExerciseRoutineInput,
  condition?: ModelExerciseRoutineConditionInput | null,
};

export type DeleteExerciseRoutineMutation = {
  deleteExerciseRoutine?:  {
    __typename: "ExerciseRoutine",
    id: string,
    routineId: string,
    exerciseId: string,
    routine?:  {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    exercise?:  {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type CreateRoutineMutationVariables = {
  input: CreateRoutineInput,
  condition?: ModelRoutineConditionInput | null,
};

export type CreateRoutineMutation = {
  createRoutine?:  {
    __typename: "Routine",
    id: string,
    name: string,
    nId: string,
    description?: string | null,
    exercises?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdateRoutineMutationVariables = {
  input: UpdateRoutineInput,
  condition?: ModelRoutineConditionInput | null,
};

export type UpdateRoutineMutation = {
  updateRoutine?:  {
    __typename: "Routine",
    id: string,
    name: string,
    nId: string,
    description?: string | null,
    exercises?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeleteRoutineMutationVariables = {
  input: DeleteRoutineInput,
  condition?: ModelRoutineConditionInput | null,
};

export type DeleteRoutineMutation = {
  deleteRoutine?:  {
    __typename: "Routine",
    id: string,
    name: string,
    nId: string,
    description?: string | null,
    exercises?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type CreateExerciseMutationVariables = {
  input: CreateExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type CreateExerciseMutation = {
  createExercise?:  {
    __typename: "Exercise",
    id: string,
    name: string,
    nId: string,
    type: ExerciseType,
    description?: string | null,
    routines?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdateExerciseMutationVariables = {
  input: UpdateExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type UpdateExerciseMutation = {
  updateExercise?:  {
    __typename: "Exercise",
    id: string,
    name: string,
    nId: string,
    type: ExerciseType,
    description?: string | null,
    routines?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeleteExerciseMutationVariables = {
  input: DeleteExerciseInput,
  condition?: ModelExerciseConditionInput | null,
};

export type DeleteExerciseMutation = {
  deleteExercise?:  {
    __typename: "Exercise",
    id: string,
    name: string,
    nId: string,
    type: ExerciseType,
    description?: string | null,
    routines?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type CreateUserExerciseStatMutationVariables = {
  input: CreateUserExerciseStatInput,
  condition?: ModelUserExerciseStatConditionInput | null,
};

export type CreateUserExerciseStatMutation = {
  createUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateUserExerciseStatMutationVariables = {
  input: UpdateUserExerciseStatInput,
  condition?: ModelUserExerciseStatConditionInput | null,
};

export type UpdateUserExerciseStatMutation = {
  updateUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteUserExerciseStatMutationVariables = {
  input: DeleteUserExerciseStatInput,
  condition?: ModelUserExerciseStatConditionInput | null,
};

export type DeleteUserExerciseStatMutation = {
  deleteUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateDailyToDoMutationVariables = {
  input: CreateDailyToDoInput,
  condition?: ModelDailyToDoConditionInput | null,
};

export type CreateDailyToDoMutation = {
  createDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateDailyToDoMutationVariables = {
  input: UpdateDailyToDoInput,
  condition?: ModelDailyToDoConditionInput | null,
};

export type UpdateDailyToDoMutation = {
  updateDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteDailyToDoMutationVariables = {
  input: DeleteDailyToDoInput,
  condition?: ModelDailyToDoConditionInput | null,
};

export type DeleteDailyToDoMutation = {
  deleteDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateScheduleToDoMutationVariables = {
  input: CreateScheduleToDoInput,
  condition?: ModelScheduleToDoConditionInput | null,
};

export type CreateScheduleToDoMutation = {
  createScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateScheduleToDoMutationVariables = {
  input: UpdateScheduleToDoInput,
  condition?: ModelScheduleToDoConditionInput | null,
};

export type UpdateScheduleToDoMutation = {
  updateScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteScheduleToDoMutationVariables = {
  input: DeleteScheduleToDoInput,
  condition?: ModelScheduleToDoConditionInput | null,
};

export type DeleteScheduleToDoMutation = {
  deleteScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateMasterToDoMutationVariables = {
  input: CreateMasterToDoInput,
  condition?: ModelMasterToDoConditionInput | null,
};

export type CreateMasterToDoMutation = {
  createMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateMasterToDoMutationVariables = {
  input: UpdateMasterToDoInput,
  condition?: ModelMasterToDoConditionInput | null,
};

export type UpdateMasterToDoMutation = {
  updateMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteMasterToDoMutationVariables = {
  input: DeleteMasterToDoInput,
  condition?: ModelMasterToDoConditionInput | null,
};

export type DeleteMasterToDoMutation = {
  deleteMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateWeeklyToDoMutationVariables = {
  input: CreateWeeklyToDoInput,
  condition?: ModelWeeklyToDoConditionInput | null,
};

export type CreateWeeklyToDoMutation = {
  createWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateWeeklyToDoMutationVariables = {
  input: UpdateWeeklyToDoInput,
  condition?: ModelWeeklyToDoConditionInput | null,
};

export type UpdateWeeklyToDoMutation = {
  updateWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteWeeklyToDoMutationVariables = {
  input: DeleteWeeklyToDoInput,
  condition?: ModelWeeklyToDoConditionInput | null,
};

export type DeleteWeeklyToDoMutation = {
  deleteWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateGroceryToDoMutationVariables = {
  input: CreateGroceryToDoInput,
  condition?: ModelGroceryToDoConditionInput | null,
};

export type CreateGroceryToDoMutation = {
  createGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateGroceryToDoMutationVariables = {
  input: UpdateGroceryToDoInput,
  condition?: ModelGroceryToDoConditionInput | null,
};

export type UpdateGroceryToDoMutation = {
  updateGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteGroceryToDoMutationVariables = {
  input: DeleteGroceryToDoInput,
  condition?: ModelGroceryToDoConditionInput | null,
};

export type DeleteGroceryToDoMutation = {
  deleteGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateScheduleMutationVariables = {
  input: CreateScheduleInput,
  condition?: ModelScheduleConditionInput | null,
};

export type CreateScheduleMutation = {
  createSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateScheduleMutationVariables = {
  input: UpdateScheduleInput,
  condition?: ModelScheduleConditionInput | null,
};

export type UpdateScheduleMutation = {
  updateSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteScheduleMutationVariables = {
  input: DeleteScheduleInput,
  condition?: ModelScheduleConditionInput | null,
};

export type DeleteScheduleMutation = {
  deleteSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateStreakMutationVariables = {
  input: CreateStreakInput,
  condition?: ModelStreakConditionInput | null,
};

export type CreateStreakMutation = {
  createStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type UpdateStreakMutationVariables = {
  input: UpdateStreakInput,
  condition?: ModelStreakConditionInput | null,
};

export type UpdateStreakMutation = {
  updateStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type DeleteStreakMutationVariables = {
  input: DeleteStreakInput,
  condition?: ModelStreakConditionInput | null,
};

export type DeleteStreakMutation = {
  deleteStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type CreateRoutineDataMutationVariables = {
  input: CreateRoutineDataInput,
  condition?: ModelRoutineDataConditionInput | null,
};

export type CreateRoutineDataMutation = {
  createRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateRoutineDataMutationVariables = {
  input: UpdateRoutineDataInput,
  condition?: ModelRoutineDataConditionInput | null,
};

export type UpdateRoutineDataMutation = {
  updateRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteRoutineDataMutationVariables = {
  input: DeleteRoutineDataInput,
  condition?: ModelRoutineDataConditionInput | null,
};

export type DeleteRoutineDataMutation = {
  deleteRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateUserActivateTypeMutationVariables = {
  input: CreateUserActivateTypeInput,
  condition?: ModelUserActivateTypeConditionInput | null,
};

export type CreateUserActivateTypeMutation = {
  createUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateUserActivateTypeMutationVariables = {
  input: UpdateUserActivateTypeInput,
  condition?: ModelUserActivateTypeConditionInput | null,
};

export type UpdateUserActivateTypeMutation = {
  updateUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteUserActivateTypeMutationVariables = {
  input: DeleteUserActivateTypeInput,
  condition?: ModelUserActivateTypeConditionInput | null,
};

export type DeleteUserActivateTypeMutation = {
  deleteUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateTagMutationVariables = {
  input: CreateTagInput,
  condition?: ModelTagConditionInput | null,
};

export type CreateTagMutation = {
  createTag?:  {
    __typename: "Tag",
    id: string,
    name: string,
    posts?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdateTagMutationVariables = {
  input: UpdateTagInput,
  condition?: ModelTagConditionInput | null,
};

export type UpdateTagMutation = {
  updateTag?:  {
    __typename: "Tag",
    id: string,
    name: string,
    posts?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeleteTagMutationVariables = {
  input: DeleteTagInput,
  condition?: ModelTagConditionInput | null,
};

export type DeleteTagMutation = {
  deleteTag?:  {
    __typename: "Tag",
    id: string,
    name: string,
    posts?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type CreatePostMutationVariables = {
  input: CreatePostInput,
  condition?: ModelPostConditionInput | null,
};

export type CreatePostMutation = {
  createPost?:  {
    __typename: "Post",
    id: string,
    dateDay: string,
    date: string,
    postUlid: string,
    caption?: string | null,
    tags?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    image?: string | null,
    userId: string,
    likes?:  {
      __typename: "ModelPostLikeConnection",
      items:  Array< {
        __typename: "PostLike",
        id: string,
        postId: string,
        userId: string,
        isLike?: boolean | null,
        username: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
        owner?: string | null,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    likeCount?: number | null,
    commentCount?: number | null,
    avatar?: string | null,
    username: string,
    profileId: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdatePostMutationVariables = {
  input: UpdatePostInput,
  condition?: ModelPostConditionInput | null,
};

export type UpdatePostMutation = {
  updatePost?:  {
    __typename: "Post",
    id: string,
    dateDay: string,
    date: string,
    postUlid: string,
    caption?: string | null,
    tags?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    image?: string | null,
    userId: string,
    likes?:  {
      __typename: "ModelPostLikeConnection",
      items:  Array< {
        __typename: "PostLike",
        id: string,
        postId: string,
        userId: string,
        isLike?: boolean | null,
        username: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
        owner?: string | null,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    likeCount?: number | null,
    commentCount?: number | null,
    avatar?: string | null,
    username: string,
    profileId: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeletePostMutationVariables = {
  input: DeletePostInput,
  condition?: ModelPostConditionInput | null,
};

export type DeletePostMutation = {
  deletePost?:  {
    __typename: "Post",
    id: string,
    dateDay: string,
    date: string,
    postUlid: string,
    caption?: string | null,
    tags?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    image?: string | null,
    userId: string,
    likes?:  {
      __typename: "ModelPostLikeConnection",
      items:  Array< {
        __typename: "PostLike",
        id: string,
        postId: string,
        userId: string,
        isLike?: boolean | null,
        username: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
        owner?: string | null,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    likeCount?: number | null,
    commentCount?: number | null,
    avatar?: string | null,
    username: string,
    profileId: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type CreatePostLikeMutationVariables = {
  input: CreatePostLikeInput,
  condition?: ModelPostLikeConditionInput | null,
};

export type CreatePostLikeMutation = {
  createPostLike?:  {
    __typename: "PostLike",
    id: string,
    postId: string,
    userId: string,
    isLike?: boolean | null,
    username: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdatePostLikeMutationVariables = {
  input: UpdatePostLikeInput,
  condition?: ModelPostLikeConditionInput | null,
};

export type UpdatePostLikeMutation = {
  updatePostLike?:  {
    __typename: "PostLike",
    id: string,
    postId: string,
    userId: string,
    isLike?: boolean | null,
    username: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeletePostLikeMutationVariables = {
  input: DeletePostLikeInput,
  condition?: ModelPostLikeConditionInput | null,
};

export type DeletePostLikeMutation = {
  deletePostLike?:  {
    __typename: "PostLike",
    id: string,
    postId: string,
    userId: string,
    isLike?: boolean | null,
    username: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateUserProfileMutationVariables = {
  input: CreateUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type CreateUserProfileMutation = {
  createUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateUserProfileMutationVariables = {
  input: UpdateUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type UpdateUserProfileMutation = {
  updateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteUserProfileMutationVariables = {
  input: DeleteUserProfileInput,
  condition?: ModelUserProfileConditionInput | null,
};

export type DeleteUserProfileMutation = {
  deleteUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateSavedPostMutationVariables = {
  input: CreateSavedPostInput,
  condition?: ModelSavedPostConditionInput | null,
};

export type CreateSavedPostMutation = {
  createSavedPost?:  {
    __typename: "SavedPost",
    id: string,
    userId: string,
    date: string,
    postId: string,
    post?:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateSavedPostMutationVariables = {
  input: UpdateSavedPostInput,
  condition?: ModelSavedPostConditionInput | null,
};

export type UpdateSavedPostMutation = {
  updateSavedPost?:  {
    __typename: "SavedPost",
    id: string,
    userId: string,
    date: string,
    postId: string,
    post?:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteSavedPostMutationVariables = {
  input: DeleteSavedPostInput,
  condition?: ModelSavedPostConditionInput | null,
};

export type DeleteSavedPostMutation = {
  deleteSavedPost?:  {
    __typename: "SavedPost",
    id: string,
    userId: string,
    date: string,
    postId: string,
    post?:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateCommentMutationVariables = {
  input: CreateCommentInput,
  condition?: ModelCommentConditionInput | null,
};

export type CreateCommentMutation = {
  createComment?:  {
    __typename: "Comment",
    id: string,
    postId: string,
    date: string,
    content: string,
    userId: string,
    username: string,
    avatar?: string | null,
    profileId: string,
    replyId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateCommentMutationVariables = {
  input: UpdateCommentInput,
  condition?: ModelCommentConditionInput | null,
};

export type UpdateCommentMutation = {
  updateComment?:  {
    __typename: "Comment",
    id: string,
    postId: string,
    date: string,
    content: string,
    userId: string,
    username: string,
    avatar?: string | null,
    profileId: string,
    replyId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteCommentMutationVariables = {
  input: DeleteCommentInput,
  condition?: ModelCommentConditionInput | null,
};

export type DeleteCommentMutation = {
  deleteComment?:  {
    __typename: "Comment",
    id: string,
    postId: string,
    date: string,
    content: string,
    userId: string,
    username: string,
    avatar?: string | null,
    profileId: string,
    replyId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreateIntegrationMutationVariables = {
  input: CreateIntegrationInput,
  condition?: ModelIntegrationConditionInput | null,
};

export type CreateIntegrationMutation = {
  createIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type UpdateIntegrationMutationVariables = {
  input: UpdateIntegrationInput,
  condition?: ModelIntegrationConditionInput | null,
};

export type UpdateIntegrationMutation = {
  updateIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type DeleteIntegrationMutationVariables = {
  input: DeleteIntegrationInput,
  condition?: ModelIntegrationConditionInput | null,
};

export type DeleteIntegrationMutation = {
  deleteIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type CreatePostTagMutationVariables = {
  input: CreatePostTagInput,
  condition?: ModelPostTagConditionInput | null,
};

export type CreatePostTagMutation = {
  createPostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type UpdatePostTagMutationVariables = {
  input: UpdatePostTagInput,
  condition?: ModelPostTagConditionInput | null,
};

export type UpdatePostTagMutation = {
  updatePostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type DeletePostTagMutationVariables = {
  input: DeletePostTagInput,
  condition?: ModelPostTagConditionInput | null,
};

export type DeletePostTagMutation = {
  deletePostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type GetActivityQueryVariables = {
  id: string,
};

export type GetActivityQuery = {
  getActivity?:  {
    __typename: "Activity",
    id: string,
    userId: string,
    date: string,
    senderId: string,
    activity: ActivityType,
    objectId?: string | null,
    sendername: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListActivitiesQueryVariables = {
  filter?: ModelActivityFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListActivitiesQuery = {
  listActivities?:  {
    __typename: "ModelActivityConnection",
    items:  Array< {
      __typename: "Activity",
      id: string,
      userId: string,
      date: string,
      senderId: string,
      activity: ActivityType,
      objectId?: string | null,
      sendername: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncActivitiesQueryVariables = {
  filter?: ModelActivityFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncActivitiesQuery = {
  syncActivities?:  {
    __typename: "ModelActivityConnection",
    items:  Array< {
      __typename: "Activity",
      id: string,
      userId: string,
      date: string,
      senderId: string,
      activity: ActivityType,
      objectId?: string | null,
      sendername: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListActivitiesByUserQueryVariables = {
  userId: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelActivityFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListActivitiesByUserQuery = {
  listActivitiesByUser?:  {
    __typename: "ModelActivityConnection",
    items:  Array< {
      __typename: "Activity",
      id: string,
      userId: string,
      date: string,
      senderId: string,
      activity: ActivityType,
      objectId?: string | null,
      sendername: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetFollowerQueryVariables = {
  userId: string,
  followerProfileId: string,
};

export type GetFollowerQuery = {
  getFollower?:  {
    __typename: "Follower",
    id: string,
    userId: string,
    followerProfileId: string,
    avatar?: string | null,
    isFollower?: boolean | null,
    username: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListFollowersQueryVariables = {
  userId?: string | null,
  followerProfileId?: ModelIDKeyConditionInput | null,
  filter?: ModelFollowerFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListFollowersQuery = {
  listFollowers?:  {
    __typename: "ModelFollowerConnection",
    items:  Array< {
      __typename: "Follower",
      id: string,
      userId: string,
      followerProfileId: string,
      avatar?: string | null,
      isFollower?: boolean | null,
      username: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncFollowersQueryVariables = {
  filter?: ModelFollowerFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncFollowersQuery = {
  syncFollowers?:  {
    __typename: "ModelFollowerConnection",
    items:  Array< {
      __typename: "Follower",
      id: string,
      userId: string,
      followerProfileId: string,
      avatar?: string | null,
      isFollower?: boolean | null,
      username: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUsersByFollowerProfileIdQueryVariables = {
  followerProfileId: string,
  userId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelFollowerFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersByFollowerProfileIdQuery = {
  listUsersByFollowerProfileId?:  {
    __typename: "ModelFollowerConnection",
    items:  Array< {
      __typename: "Follower",
      id: string,
      userId: string,
      followerProfileId: string,
      avatar?: string | null,
      isFollower?: boolean | null,
      username: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetFollowingQueryVariables = {
  id: string,
};

export type GetFollowingQuery = {
  getFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListFollowingsQueryVariables = {
  filter?: ModelFollowingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListFollowingsQuery = {
  listFollowings?:  {
    __typename: "ModelFollowingConnection",
    items:  Array< {
      __typename: "Following",
      id: string,
      userId: string,
      followingProfileId: string,
      username: string,
      avatar?: string | null,
      isFollowing?: boolean | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncFollowingsQueryVariables = {
  filter?: ModelFollowingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncFollowingsQuery = {
  syncFollowings?:  {
    __typename: "ModelFollowingConnection",
    items:  Array< {
      __typename: "Following",
      id: string,
      userId: string,
      followingProfileId: string,
      username: string,
      avatar?: string | null,
      isFollowing?: boolean | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListFollowingByUserQueryVariables = {
  userId: string,
  followingProfileId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelFollowingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListFollowingByUserQuery = {
  listFollowingByUser?:  {
    __typename: "ModelFollowingConnection",
    items:  Array< {
      __typename: "Following",
      id: string,
      userId: string,
      followingProfileId: string,
      username: string,
      avatar?: string | null,
      isFollowing?: boolean | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUsersByFollowingProfileIdQueryVariables = {
  followingProfileId: string,
  userId?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelFollowingFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersByFollowingProfileIdQuery = {
  listUsersByFollowingProfileId?:  {
    __typename: "ModelFollowingConnection",
    items:  Array< {
      __typename: "Following",
      id: string,
      userId: string,
      followingProfileId: string,
      username: string,
      avatar?: string | null,
      isFollowing?: boolean | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      profileId: string,
      sub: string,
      email?: string | null,
      phoneNumber?: string | null,
      name?: string | null,
      customerId?: string | null,
      timezone?: string | null,
      onboard?: boolean | null,
      paymentCards?:  Array< {
        __typename: "Card",
        cardId?: string | null,
        cardBrand?: string | null,
        bin?: number | null,
        preferred?: boolean | null,
      } | null > | null,
      pushToken?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncUsersQuery = {
  syncUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      profileId: string,
      sub: string,
      email?: string | null,
      phoneNumber?: string | null,
      name?: string | null,
      customerId?: string | null,
      timezone?: string | null,
      onboard?: boolean | null,
      paymentCards?:  Array< {
        __typename: "Card",
        cardId?: string | null,
        cardBrand?: string | null,
        bin?: number | null,
        preferred?: boolean | null,
      } | null > | null,
      pushToken?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUsersBySubQueryVariables = {
  sub: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersBySubQuery = {
  listUsersBySub?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      profileId: string,
      sub: string,
      email?: string | null,
      phoneNumber?: string | null,
      name?: string | null,
      customerId?: string | null,
      timezone?: string | null,
      onboard?: boolean | null,
      paymentCards?:  Array< {
        __typename: "Card",
        cardId?: string | null,
        cardBrand?: string | null,
        bin?: number | null,
        preferred?: boolean | null,
      } | null > | null,
      pushToken?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetGoalQueryVariables = {
  id: string,
};

export type GetGoalQuery = {
  getGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListGoalsQueryVariables = {
  filter?: ModelGoalFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGoalsQuery = {
  listGoals?:  {
    __typename: "ModelGoalConnection",
    items:  Array< {
      __typename: "Goal",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: string | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncGoalsQueryVariables = {
  filter?: ModelGoalFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncGoalsQuery = {
  syncGoals?:  {
    __typename: "ModelGoalConnection",
    items:  Array< {
      __typename: "Goal",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: string | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUserGoalsByDateQueryVariables = {
  userId: string,
  dateStatusPrimaryGoalType?: ModelGoalByUserByDateCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelGoalFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserGoalsByDateQuery = {
  listUserGoalsByDate?:  {
    __typename: "ModelGoalConnection",
    items:  Array< {
      __typename: "Goal",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: string | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetGoalExerciseQueryVariables = {
  id: string,
};

export type GetGoalExerciseQuery = {
  getGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListGoalExercisesQueryVariables = {
  filter?: ModelGoalExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGoalExercisesQuery = {
  listGoalExercises?:  {
    __typename: "ModelGoalExerciseConnection",
    items:  Array< {
      __typename: "GoalExercise",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: ExerciseGoalPreference | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncGoalExercisesQueryVariables = {
  filter?: ModelGoalExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncGoalExercisesQuery = {
  syncGoalExercises?:  {
    __typename: "ModelGoalExerciseConnection",
    items:  Array< {
      __typename: "GoalExercise",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: ExerciseGoalPreference | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUserGoalExercisesByDateQueryVariables = {
  userId: string,
  dateStatusPrimaryGoalTypeSecondaryGoalType?: ModelGoalExerciseByUserByDateCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelGoalExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserGoalExercisesByDateQuery = {
  listUserGoalExercisesByDate?:  {
    __typename: "ModelGoalExerciseConnection",
    items:  Array< {
      __typename: "GoalExercise",
      id: string,
      userId: string,
      date: string,
      status: Status,
      endDate: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      scheduleId?: string | null,
      goal?: string | null,
      goalUnit?: ExerciseGoalPreference | null,
      previousWeek?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetStepDataQueryVariables = {
  id: string,
};

export type GetStepDataQuery = {
  getStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListStepDataQueryVariables = {
  filter?: ModelStepDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStepDataQuery = {
  listStepData?:  {
    __typename: "ModelStepDataConnection",
    items:  Array< {
      __typename: "StepData",
      id: string,
      date: string,
      userId: string,
      steps?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncStepDataQueryVariables = {
  filter?: ModelStepDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncStepDataQuery = {
  syncStepData?:  {
    __typename: "ModelStepDataConnection",
    items:  Array< {
      __typename: "StepData",
      id: string,
      date: string,
      userId: string,
      steps?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type StepsDataByUserByDateQueryVariables = {
  userId: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelStepDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type StepsDataByUserByDateQuery = {
  stepsDataByUserByDate?:  {
    __typename: "ModelStepDataConnection",
    items:  Array< {
      __typename: "StepData",
      id: string,
      date: string,
      userId: string,
      steps?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetStrengthDataQueryVariables = {
  id: string,
};

export type GetStrengthDataQuery = {
  getStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListStrengthDataQueryVariables = {
  filter?: ModelStrengthDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStrengthDataQuery = {
  listStrengthData?:  {
    __typename: "ModelStrengthDataConnection",
    items:  Array< {
      __typename: "StrengthData",
      id: string,
      userId: string,
      type: string,
      userIdType: string,
      date: string,
      weight: number,
      weightUnit?: string | null,
      reps?: number | null,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncStrengthDataQueryVariables = {
  filter?: ModelStrengthDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncStrengthDataQuery = {
  syncStrengthData?:  {
    __typename: "ModelStrengthDataConnection",
    items:  Array< {
      __typename: "StrengthData",
      id: string,
      userId: string,
      type: string,
      userIdType: string,
      date: string,
      weight: number,
      weightUnit?: string | null,
      reps?: number | null,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type StrengthDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelStrengthDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type StrengthDataByUserByTypeAndDateQuery = {
  strengthDataByUserByTypeAndDate?:  {
    __typename: "ModelStrengthDataConnection",
    items:  Array< {
      __typename: "StrengthData",
      id: string,
      userId: string,
      type: string,
      userIdType: string,
      date: string,
      weight: number,
      weightUnit?: string | null,
      reps?: number | null,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetEnduranceDataQueryVariables = {
  id: string,
};

export type GetEnduranceDataQuery = {
  getEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListEnduranceDataQueryVariables = {
  filter?: ModelEnduranceDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListEnduranceDataQuery = {
  listEnduranceData?:  {
    __typename: "ModelEnduranceDataConnection",
    items:  Array< {
      __typename: "EnduranceData",
      id: string,
      date: string,
      userId: string,
      minutes?: number | null,
      reps?: number | null,
      type: string,
      distance?: number | null,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncEnduranceDataQueryVariables = {
  filter?: ModelEnduranceDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncEnduranceDataQuery = {
  syncEnduranceData?:  {
    __typename: "ModelEnduranceDataConnection",
    items:  Array< {
      __typename: "EnduranceData",
      id: string,
      date: string,
      userId: string,
      minutes?: number | null,
      reps?: number | null,
      type: string,
      distance?: number | null,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ExerciseDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelEnduranceDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ExerciseDataByUserByTypeAndDateQuery = {
  exerciseDataByUserByTypeAndDate?:  {
    __typename: "ModelEnduranceDataConnection",
    items:  Array< {
      __typename: "EnduranceData",
      id: string,
      date: string,
      userId: string,
      minutes?: number | null,
      reps?: number | null,
      type: string,
      distance?: number | null,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetWeightDataQueryVariables = {
  id: string,
};

export type GetWeightDataQuery = {
  getWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListWeightDataQueryVariables = {
  filter?: ModelWeightDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWeightDataQuery = {
  listWeightData?:  {
    __typename: "ModelWeightDataConnection",
    items:  Array< {
      __typename: "WeightData",
      id: string,
      date: string,
      userId: string,
      weight: number,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncWeightDataQueryVariables = {
  filter?: ModelWeightDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncWeightDataQuery = {
  syncWeightData?:  {
    __typename: "ModelWeightDataConnection",
    items:  Array< {
      __typename: "WeightData",
      id: string,
      date: string,
      userId: string,
      weight: number,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type WeightDataByUserByDateQueryVariables = {
  userId: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelWeightDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type WeightDataByUserByDateQuery = {
  weightDataByUserByDate?:  {
    __typename: "ModelWeightDataConnection",
    items:  Array< {
      __typename: "WeightData",
      id: string,
      date: string,
      userId: string,
      weight: number,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetNewSkillTypeDataQueryVariables = {
  id: string,
};

export type GetNewSkillTypeDataQuery = {
  getNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListNewSkillTypeDataQueryVariables = {
  filter?: ModelNewSkillTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListNewSkillTypeDataQuery = {
  listNewSkillTypeData?:  {
    __typename: "ModelNewSkillTypeDataConnection",
    items:  Array< {
      __typename: "NewSkillTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncNewSkillTypeDataQueryVariables = {
  filter?: ModelNewSkillTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncNewSkillTypeDataQuery = {
  syncNewSkillTypeData?:  {
    __typename: "ModelNewSkillTypeDataConnection",
    items:  Array< {
      __typename: "NewSkillTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type NewSkillDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelNewSkillTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type NewSkillDataByUserByTypeAndDateQuery = {
  newSkillDataByUserByTypeAndDate?:  {
    __typename: "ModelNewSkillTypeDataConnection",
    items:  Array< {
      __typename: "NewSkillTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetHabitTypeDataQueryVariables = {
  id: string,
};

export type GetHabitTypeDataQuery = {
  getHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListHabitTypeDataQueryVariables = {
  filter?: ModelHabitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListHabitTypeDataQuery = {
  listHabitTypeData?:  {
    __typename: "ModelHabitTypeDataConnection",
    items:  Array< {
      __typename: "HabitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncHabitTypeDataQueryVariables = {
  filter?: ModelHabitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncHabitTypeDataQuery = {
  syncHabitTypeData?:  {
    __typename: "ModelHabitTypeDataConnection",
    items:  Array< {
      __typename: "HabitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type HabitDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelHabitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type HabitDataByUserByTypeAndDateQuery = {
  habitDataByUserByTypeAndDate?:  {
    __typename: "ModelHabitTypeDataConnection",
    items:  Array< {
      __typename: "HabitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetLimitTypeDataQueryVariables = {
  id: string,
};

export type GetLimitTypeDataQuery = {
  getLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListLimitTypeDataQueryVariables = {
  filter?: ModelLimitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLimitTypeDataQuery = {
  listLimitTypeData?:  {
    __typename: "ModelLimitTypeDataConnection",
    items:  Array< {
      __typename: "LimitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncLimitTypeDataQueryVariables = {
  filter?: ModelLimitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncLimitTypeDataQuery = {
  syncLimitTypeData?:  {
    __typename: "ModelLimitTypeDataConnection",
    items:  Array< {
      __typename: "LimitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type LimitDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelLimitTypeDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type LimitDataByUserByTypeAndDateQuery = {
  limitDataByUserByTypeAndDate?:  {
    __typename: "ModelLimitTypeDataConnection",
    items:  Array< {
      __typename: "LimitTypeData",
      id: string,
      date: string,
      userId: string,
      value?: number | null,
      unit?: string | null,
      type: string,
      userIdType: string,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetMeditationDataQueryVariables = {
  id: string,
};

export type GetMeditationDataQuery = {
  getMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListMeditationDataQueryVariables = {
  filter?: ModelMeditationDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMeditationDataQuery = {
  listMeditationData?:  {
    __typename: "ModelMeditationDataConnection",
    items:  Array< {
      __typename: "MeditationData",
      id: string,
      date: string,
      userId: string,
      minutes: number,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncMeditationDataQueryVariables = {
  filter?: ModelMeditationDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncMeditationDataQuery = {
  syncMeditationData?:  {
    __typename: "ModelMeditationDataConnection",
    items:  Array< {
      __typename: "MeditationData",
      id: string,
      date: string,
      userId: string,
      minutes: number,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type MeditationDataByUserByDateQueryVariables = {
  userId: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelMeditationDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type MeditationDataByUserByDateQuery = {
  meditationDataByUserByDate?:  {
    __typename: "ModelMeditationDataConnection",
    items:  Array< {
      __typename: "MeditationData",
      id: string,
      date: string,
      userId: string,
      minutes: number,
      scheduleId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetLevelQueryVariables = {
  id: string,
};

export type GetLevelQuery = {
  getLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListLevelsQueryVariables = {
  filter?: ModelLevelFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLevelsQuery = {
  listLevels?:  {
    __typename: "ModelLevelConnection",
    items:  Array< {
      __typename: "Level",
      id: string,
      userId: string,
      level: number,
      attempts?: number | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      date: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncLevelsQueryVariables = {
  filter?: ModelLevelFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncLevelsQuery = {
  syncLevels?:  {
    __typename: "ModelLevelConnection",
    items:  Array< {
      __typename: "Level",
      id: string,
      userId: string,
      level: number,
      attempts?: number | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      date: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListGoalTypesByUserQueryVariables = {
  userId: string,
  primaryGoalTypeSecondaryGoalTypeDate?: ModelLevelByUserByGoalTypeCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelLevelFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGoalTypesByUserQuery = {
  listGoalTypesByUser?:  {
    __typename: "ModelLevelConnection",
    items:  Array< {
      __typename: "Level",
      id: string,
      userId: string,
      level: number,
      attempts?: number | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      date: string,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetPointQueryVariables = {
  id: string,
};

export type GetPointQuery = {
  getPoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListPointsQueryVariables = {
  filter?: ModelPointFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPointsQuery = {
  listPoints?:  {
    __typename: "ModelPointConnection",
    items:  Array< {
      __typename: "Point",
      id: string,
      points?: number | null,
      currentPoints?: number | null,
      max?: number | null,
      min?: number | null,
      maxDate?: string | null,
      minDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncPointsQueryVariables = {
  filter?: ModelPointFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncPointsQuery = {
  syncPoints?:  {
    __typename: "ModelPointConnection",
    items:  Array< {
      __typename: "Point",
      id: string,
      points?: number | null,
      currentPoints?: number | null,
      max?: number | null,
      min?: number | null,
      maxDate?: string | null,
      minDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetUserStatQueryVariables = {
  id: string,
};

export type GetUserStatQuery = {
  getUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListUserStatsQueryVariables = {
  filter?: ModelUserStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserStatsQuery = {
  listUserStats?:  {
    __typename: "ModelUserStatConnection",
    items:  Array< {
      __typename: "UserStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userId: string,
      value: number,
      currentValue?: number | null,
      max?: number | null,
      min?: number | null,
      maxDate?: string | null,
      minDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncUserStatsQueryVariables = {
  filter?: ModelUserStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncUserStatsQuery = {
  syncUserStats?:  {
    __typename: "ModelUserStatConnection",
    items:  Array< {
      __typename: "UserStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userId: string,
      value: number,
      currentValue?: number | null,
      max?: number | null,
      min?: number | null,
      maxDate?: string | null,
      minDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListStatsByUserQueryVariables = {
  userId: string,
  primaryGoalType?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStatsByUserQuery = {
  listStatsByUser?:  {
    __typename: "ModelUserStatConnection",
    items:  Array< {
      __typename: "UserStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userId: string,
      value: number,
      currentValue?: number | null,
      max?: number | null,
      min?: number | null,
      maxDate?: string | null,
      minDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetRoutineQueryVariables = {
  id: string,
};

export type GetRoutineQuery = {
  getRoutine?:  {
    __typename: "Routine",
    id: string,
    name: string,
    nId: string,
    description?: string | null,
    exercises?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type ListRoutinesQueryVariables = {
  filter?: ModelRoutineFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRoutinesQuery = {
  listRoutines?:  {
    __typename: "ModelRoutineConnection",
    items:  Array< {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncRoutinesQueryVariables = {
  filter?: ModelRoutineFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncRoutinesQuery = {
  syncRoutines?:  {
    __typename: "ModelRoutineConnection",
    items:  Array< {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListRoutinesByNameQueryVariables = {
  nId: string,
  name?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelRoutineFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRoutinesByNameQuery = {
  listRoutinesByName?:  {
    __typename: "ModelRoutineConnection",
    items:  Array< {
      __typename: "Routine",
      id: string,
      name: string,
      nId: string,
      description?: string | null,
      exercises?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetExerciseQueryVariables = {
  id: string,
};

export type GetExerciseQuery = {
  getExercise?:  {
    __typename: "Exercise",
    id: string,
    name: string,
    nId: string,
    type: ExerciseType,
    description?: string | null,
    routines?:  {
      __typename: "ModelExerciseRoutineConnection",
      items:  Array< {
        __typename: "ExerciseRoutine",
        id: string,
        routineId: string,
        exerciseId: string,
        routine?:  {
          __typename: "Routine",
          id: string,
          name: string,
          nId: string,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        exercise?:  {
          __typename: "Exercise",
          id: string,
          name: string,
          nId: string,
          type: ExerciseType,
          description?: string | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type ListExercisesQueryVariables = {
  filter?: ModelExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExercisesQuery = {
  listExercises?:  {
    __typename: "ModelExerciseConnection",
    items:  Array< {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncExercisesQueryVariables = {
  filter?: ModelExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncExercisesQuery = {
  syncExercises?:  {
    __typename: "ModelExerciseConnection",
    items:  Array< {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListExerciseByNameQueryVariables = {
  nId: string,
  name?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelExerciseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExerciseByNameQuery = {
  listExerciseByName?:  {
    __typename: "ModelExerciseConnection",
    items:  Array< {
      __typename: "Exercise",
      id: string,
      name: string,
      nId: string,
      type: ExerciseType,
      description?: string | null,
      routines?:  {
        __typename: "ModelExerciseRoutineConnection",
        items:  Array< {
          __typename: "ExerciseRoutine",
          id: string,
          routineId: string,
          exerciseId: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetUserExerciseStatQueryVariables = {
  id: string,
};

export type GetUserExerciseStatQuery = {
  getUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListUserExerciseStatsQueryVariables = {
  filter?: ModelUserExerciseStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserExerciseStatsQuery = {
  listUserExerciseStats?:  {
    __typename: "ModelUserExerciseStatConnection",
    items:  Array< {
      __typename: "UserExerciseStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      userId: string,
      repsValue?: number | null,
      minutesValue?: number | null,
      weightValue?: number | null,
      distanceValue?: number | null,
      currentRepsValue?: number | null,
      currentMinutesValue?: number | null,
      currentDistanceValue?: number | null,
      currentWeightValue?: number | null,
      maxReps?: number | null,
      minReps?: number | null,
      maxRepsDate?: string | null,
      minRepsDate?: string | null,
      maxMinutes?: number | null,
      minMinutes?: number | null,
      maxMinutesDate?: string | null,
      minMinutesDate?: string | null,
      maxWeight?: number | null,
      minWeight?: number | null,
      maxWeightDate?: string | null,
      minWeightDate?: string | null,
      maxDistance?: number | null,
      minDistance?: number | null,
      maxDistanceDate?: string | null,
      minDistanceDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      unit?: string | null,
      statPreference?: StatPreference | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncUserExerciseStatsQueryVariables = {
  filter?: ModelUserExerciseStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncUserExerciseStatsQuery = {
  syncUserExerciseStats?:  {
    __typename: "ModelUserExerciseStatConnection",
    items:  Array< {
      __typename: "UserExerciseStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      userId: string,
      repsValue?: number | null,
      minutesValue?: number | null,
      weightValue?: number | null,
      distanceValue?: number | null,
      currentRepsValue?: number | null,
      currentMinutesValue?: number | null,
      currentDistanceValue?: number | null,
      currentWeightValue?: number | null,
      maxReps?: number | null,
      minReps?: number | null,
      maxRepsDate?: string | null,
      minRepsDate?: string | null,
      maxMinutes?: number | null,
      minMinutes?: number | null,
      maxMinutesDate?: string | null,
      minMinutesDate?: string | null,
      maxWeight?: number | null,
      minWeight?: number | null,
      maxWeightDate?: string | null,
      minWeightDate?: string | null,
      maxDistance?: number | null,
      minDistance?: number | null,
      maxDistanceDate?: string | null,
      minDistanceDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      unit?: string | null,
      statPreference?: StatPreference | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListExerciseStatsByUserQueryVariables = {
  userId: string,
  primaryGoalTypeSecondaryGoalType?: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserExerciseStatFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExerciseStatsByUserQuery = {
  listExerciseStatsByUser?:  {
    __typename: "ModelUserExerciseStatConnection",
    items:  Array< {
      __typename: "UserExerciseStat",
      id: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      userId: string,
      repsValue?: number | null,
      minutesValue?: number | null,
      weightValue?: number | null,
      distanceValue?: number | null,
      currentRepsValue?: number | null,
      currentMinutesValue?: number | null,
      currentDistanceValue?: number | null,
      currentWeightValue?: number | null,
      maxReps?: number | null,
      minReps?: number | null,
      maxRepsDate?: string | null,
      minRepsDate?: string | null,
      maxMinutes?: number | null,
      minMinutes?: number | null,
      maxMinutesDate?: string | null,
      minMinutesDate?: string | null,
      maxWeight?: number | null,
      minWeight?: number | null,
      maxWeightDate?: string | null,
      minWeightDate?: string | null,
      maxDistance?: number | null,
      minDistance?: number | null,
      maxDistanceDate?: string | null,
      minDistanceDate?: string | null,
      currentDate?: string | null,
      dayCount?: number | null,
      unit?: string | null,
      statPreference?: StatPreference | null,
      lastStreakStartDate?: string | null,
      lastStreakEndDate?: string | null,
      lastStreakValue?: number | null,
      bestStreakStartDate?: string | null,
      bestStreakEndDate?: string | null,
      bestStreakValue?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetDailyToDoQueryVariables = {
  id: string,
};

export type GetDailyToDoQuery = {
  getDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListDailyToDosQueryVariables = {
  filter?: ModelDailyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDailyToDosQuery = {
  listDailyToDos?:  {
    __typename: "ModelDailyToDoConnection",
    items:  Array< {
      __typename: "DailyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncDailyToDosQueryVariables = {
  filter?: ModelDailyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncDailyToDosQuery = {
  syncDailyToDos?:  {
    __typename: "ModelDailyToDoConnection",
    items:  Array< {
      __typename: "DailyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListDailyTodosByUserQueryVariables = {
  userId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelDailyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDailyTodosByUserQuery = {
  listDailyTodosByUser?:  {
    __typename: "ModelDailyToDoConnection",
    items:  Array< {
      __typename: "DailyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetScheduleToDoQueryVariables = {
  id: string,
};

export type GetScheduleToDoQuery = {
  getScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListScheduleToDosQueryVariables = {
  filter?: ModelScheduleToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListScheduleToDosQuery = {
  listScheduleToDos?:  {
    __typename: "ModelScheduleToDoConnection",
    items:  Array< {
      __typename: "ScheduleToDo",
      id: string,
      taskId: string,
      status: Status,
      userId: string,
      date: string,
      dayFrequency?: number | null,
      frequency: FREQUENCY,
      interval?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      byWeekDay?: Array< Day | null > | null,
      dayReminder?: boolean | null,
      dayReminderTimeRange?: Array< string | null > | null,
      dayReminderTimes?: Array< string | null > | null,
      deadlineAlarms?: Array< string | null > | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncScheduleToDosQueryVariables = {
  filter?: ModelScheduleToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncScheduleToDosQuery = {
  syncScheduleToDos?:  {
    __typename: "ModelScheduleToDoConnection",
    items:  Array< {
      __typename: "ScheduleToDo",
      id: string,
      taskId: string,
      status: Status,
      userId: string,
      date: string,
      dayFrequency?: number | null,
      frequency: FREQUENCY,
      interval?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      byWeekDay?: Array< Day | null > | null,
      dayReminder?: boolean | null,
      dayReminderTimeRange?: Array< string | null > | null,
      dayReminderTimes?: Array< string | null > | null,
      deadlineAlarms?: Array< string | null > | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListActiveToDoSchedulesByDateQueryVariables = {
  userId: string,
  dateStatus?: ModelScheduleToDoByUserByDateCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelScheduleToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListActiveToDoSchedulesByDateQuery = {
  listActiveToDoSchedulesByDate?:  {
    __typename: "ModelScheduleToDoConnection",
    items:  Array< {
      __typename: "ScheduleToDo",
      id: string,
      taskId: string,
      status: Status,
      userId: string,
      date: string,
      dayFrequency?: number | null,
      frequency: FREQUENCY,
      interval?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      byWeekDay?: Array< Day | null > | null,
      dayReminder?: boolean | null,
      dayReminderTimeRange?: Array< string | null > | null,
      dayReminderTimes?: Array< string | null > | null,
      deadlineAlarms?: Array< string | null > | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetMasterToDoQueryVariables = {
  id: string,
};

export type GetMasterToDoQuery = {
  getMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListMasterToDosQueryVariables = {
  filter?: ModelMasterToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMasterToDosQuery = {
  listMasterToDos?:  {
    __typename: "ModelMasterToDoConnection",
    items:  Array< {
      __typename: "MasterToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncMasterToDosQueryVariables = {
  filter?: ModelMasterToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncMasterToDosQuery = {
  syncMasterToDos?:  {
    __typename: "ModelMasterToDoConnection",
    items:  Array< {
      __typename: "MasterToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListMasterTodosByUserQueryVariables = {
  userId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelMasterToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMasterTodosByUserQuery = {
  listMasterTodosByUser?:  {
    __typename: "ModelMasterToDoConnection",
    items:  Array< {
      __typename: "MasterToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetWeeklyToDoQueryVariables = {
  id: string,
};

export type GetWeeklyToDoQuery = {
  getWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListWeeklyToDosQueryVariables = {
  filter?: ModelWeeklyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWeeklyToDosQuery = {
  listWeeklyToDos?:  {
    __typename: "ModelWeeklyToDoConnection",
    items:  Array< {
      __typename: "WeeklyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncWeeklyToDosQueryVariables = {
  filter?: ModelWeeklyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncWeeklyToDosQuery = {
  syncWeeklyToDos?:  {
    __typename: "ModelWeeklyToDoConnection",
    items:  Array< {
      __typename: "WeeklyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListWeeklyTodosByUserQueryVariables = {
  userId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelWeeklyToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWeeklyTodosByUserQuery = {
  listWeeklyTodosByUser?:  {
    __typename: "ModelWeeklyToDoConnection",
    items:  Array< {
      __typename: "WeeklyToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetGroceryToDoQueryVariables = {
  id: string,
};

export type GetGroceryToDoQuery = {
  getGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListGroceryToDosQueryVariables = {
  filter?: ModelGroceryToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGroceryToDosQuery = {
  listGroceryToDos?:  {
    __typename: "ModelGroceryToDoConnection",
    items:  Array< {
      __typename: "GroceryToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncGroceryToDosQueryVariables = {
  filter?: ModelGroceryToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncGroceryToDosQuery = {
  syncGroceryToDos?:  {
    __typename: "ModelGroceryToDoConnection",
    items:  Array< {
      __typename: "GroceryToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListGroceryTodosByUserQueryVariables = {
  userId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelGroceryToDoFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListGroceryTodosByUserQuery = {
  listGroceryTodosByUser?:  {
    __typename: "ModelGroceryToDoConnection",
    items:  Array< {
      __typename: "GroceryToDo",
      id: string,
      userId: string,
      notes?: string | null,
      completed?: boolean | null,
      startDate?: string | null,
      endDate?: string | null,
      completedDate?: string | null,
      nextDay?: boolean | null,
      important?: boolean | null,
      date?: string | null,
      event?: boolean | null,
      scheduleId?: string | null,
      softDeadline?: string | null,
      hardDeadline?: string | null,
      recurring?: boolean | null,
      syncId?: string | null,
      syncName?: string | null,
      status?: ToDoStatus | null,
      parentId?: string | null,
      location?: string | null,
      tags?: Array< string | null > | null,
      heading?: string | null,
      order?: number | null,
      eventId?: string | null,
      duration?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetScheduleQueryVariables = {
  id: string,
};

export type GetScheduleQuery = {
  getSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListSchedulesQueryVariables = {
  filter?: ModelScheduleFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSchedulesQuery = {
  listSchedules?:  {
    __typename: "ModelScheduleConnection",
    items:  Array< {
      __typename: "Schedule",
      id: string,
      primaryGoalType?: PrimaryGoalType | null,
      secondaryGoalType?: string | null,
      status: Status,
      userId: string,
      date: string,
      userIdGoal: string,
      unit?: string | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncSchedulesQueryVariables = {
  filter?: ModelScheduleFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncSchedulesQuery = {
  syncSchedules?:  {
    __typename: "ModelScheduleConnection",
    items:  Array< {
      __typename: "Schedule",
      id: string,
      primaryGoalType?: PrimaryGoalType | null,
      secondaryGoalType?: string | null,
      status: Status,
      userId: string,
      date: string,
      userIdGoal: string,
      unit?: string | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListActiveSchedulesByDateQueryVariables = {
  userIdGoal: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelScheduleFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListActiveSchedulesByDateQuery = {
  listActiveSchedulesByDate?:  {
    __typename: "ModelScheduleConnection",
    items:  Array< {
      __typename: "Schedule",
      id: string,
      primaryGoalType?: PrimaryGoalType | null,
      secondaryGoalType?: string | null,
      status: Status,
      userId: string,
      date: string,
      userIdGoal: string,
      unit?: string | null,
      ttl?: number | null,
      eventId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetStreakQueryVariables = {
  id: string,
};

export type GetStreakQuery = {
  getStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type ListStreaksQueryVariables = {
  filter?: ModelStreakFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStreaksQuery = {
  listStreaks?:  {
    __typename: "ModelStreakConnection",
    items:  Array< {
      __typename: "Streak",
      id: string,
      dataType?: string | null,
      goalId?: string | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userIdGoal: string,
      userId: string,
      streak?: number | null,
      startDate: string,
      endDate?: string | null,
      lastSyncDate?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      trainerId?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncStreaksQueryVariables = {
  filter?: ModelStreakFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncStreaksQuery = {
  syncStreaks?:  {
    __typename: "ModelStreakConnection",
    items:  Array< {
      __typename: "Streak",
      id: string,
      dataType?: string | null,
      goalId?: string | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userIdGoal: string,
      userId: string,
      streak?: number | null,
      startDate: string,
      endDate?: string | null,
      lastSyncDate?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      trainerId?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListStreaksByUserAndGoalTypeQueryVariables = {
  userIdGoal: string,
  startDate?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelStreakFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListStreaksByUserAndGoalTypeQuery = {
  listStreaksByUserAndGoalType?:  {
    __typename: "ModelStreakConnection",
    items:  Array< {
      __typename: "Streak",
      id: string,
      dataType?: string | null,
      goalId?: string | null,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType?: string | null,
      userIdGoal: string,
      userId: string,
      streak?: number | null,
      startDate: string,
      endDate?: string | null,
      lastSyncDate?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      trainerId?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetRoutineDataQueryVariables = {
  id: string,
};

export type GetRoutineDataQuery = {
  getRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListRoutineDataQueryVariables = {
  filter?: ModelRoutineDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListRoutineDataQuery = {
  listRoutineData?:  {
    __typename: "ModelRoutineDataConnection",
    items:  Array< {
      __typename: "RoutineData",
      id: string,
      userId: string,
      date: string,
      userIdType: string,
      type: string,
      rest?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncRoutineDataQueryVariables = {
  filter?: ModelRoutineDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncRoutineDataQuery = {
  syncRoutineData?:  {
    __typename: "ModelRoutineDataConnection",
    items:  Array< {
      __typename: "RoutineData",
      id: string,
      userId: string,
      date: string,
      userIdType: string,
      type: string,
      rest?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type RoutineDataByUserByTypeAndDateQueryVariables = {
  userIdType: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelRoutineDataFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type RoutineDataByUserByTypeAndDateQuery = {
  routineDataByUserByTypeAndDate?:  {
    __typename: "ModelRoutineDataConnection",
    items:  Array< {
      __typename: "RoutineData",
      id: string,
      userId: string,
      date: string,
      userIdType: string,
      type: string,
      rest?: number | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetUserActivateTypeQueryVariables = {
  id: string,
};

export type GetUserActivateTypeQuery = {
  getUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListUserActivateTypesQueryVariables = {
  filter?: ModelUserActivateTypeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserActivateTypesQuery = {
  listUserActivateTypes?:  {
    __typename: "ModelUserActivateTypeConnection",
    items:  Array< {
      __typename: "UserActivateType",
      id: string,
      userId: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      activated: boolean,
      secondaryGoalName?: string | null,
      routineId?: string | null,
      exerciseId?: string | null,
      unit?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncUserActivateTypesQueryVariables = {
  filter?: ModelUserActivateTypeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncUserActivateTypesQuery = {
  syncUserActivateTypes?:  {
    __typename: "ModelUserActivateTypeConnection",
    items:  Array< {
      __typename: "UserActivateType",
      id: string,
      userId: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      activated: boolean,
      secondaryGoalName?: string | null,
      routineId?: string | null,
      exerciseId?: string | null,
      unit?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListActivateTypesByUserQueryVariables = {
  userId: string,
  primaryGoalTypeSecondaryGoalType?: ModelUserActivateTypeByUserByGoalTypeCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserActivateTypeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListActivateTypesByUserQuery = {
  listActivateTypesByUser?:  {
    __typename: "ModelUserActivateTypeConnection",
    items:  Array< {
      __typename: "UserActivateType",
      id: string,
      userId: string,
      primaryGoalType: PrimaryGoalType,
      secondaryGoalType: string,
      activated: boolean,
      secondaryGoalName?: string | null,
      routineId?: string | null,
      exerciseId?: string | null,
      unit?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetTagQueryVariables = {
  id: string,
};

export type GetTagQuery = {
  getTag?:  {
    __typename: "Tag",
    id: string,
    name: string,
    posts?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type ListTagsQueryVariables = {
  filter?: ModelTagFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTagsQuery = {
  listTags?:  {
    __typename: "ModelTagConnection",
    items:  Array< {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncTagsQueryVariables = {
  filter?: ModelTagFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncTagsQuery = {
  syncTags?:  {
    __typename: "ModelTagConnection",
    items:  Array< {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListTagsByNameQueryVariables = {
  name: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTagFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTagsByNameQuery = {
  listTagsByName?:  {
    __typename: "ModelTagConnection",
    items:  Array< {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetPostQueryVariables = {
  id: string,
};

export type GetPostQuery = {
  getPost?:  {
    __typename: "Post",
    id: string,
    dateDay: string,
    date: string,
    postUlid: string,
    caption?: string | null,
    tags?:  {
      __typename: "ModelPostTagConnection",
      items:  Array< {
        __typename: "PostTag",
        id: string,
        tagID: string,
        postID: string,
        tag:  {
          __typename: "Tag",
          id: string,
          name: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        post:  {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        },
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    image?: string | null,
    userId: string,
    likes?:  {
      __typename: "ModelPostLikeConnection",
      items:  Array< {
        __typename: "PostLike",
        id: string,
        postId: string,
        userId: string,
        isLike?: boolean | null,
        username: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
        owner?: string | null,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    likeCount?: number | null,
    commentCount?: number | null,
    avatar?: string | null,
    username: string,
    profileId: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type ListPostsQueryVariables = {
  filter?: ModelPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostsQuery = {
  listPosts?:  {
    __typename: "ModelPostConnection",
    items:  Array< {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncPostsQueryVariables = {
  filter?: ModelPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncPostsQuery = {
  syncPosts?:  {
    __typename: "ModelPostConnection",
    items:  Array< {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListPostsByDateDayQueryVariables = {
  dateDay: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostsByDateDayQuery = {
  listPostsByDateDay?:  {
    __typename: "ModelPostConnection",
    items:  Array< {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListPostsByUserIdQueryVariables = {
  userId: string,
  date?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostsByUserIdQuery = {
  listPostsByUserId?:  {
    __typename: "ModelPostConnection",
    items:  Array< {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetPostLikeQueryVariables = {
  id: string,
};

export type GetPostLikeQuery = {
  getPostLike?:  {
    __typename: "PostLike",
    id: string,
    postId: string,
    userId: string,
    isLike?: boolean | null,
    username: string,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListPostLikesQueryVariables = {
  filter?: ModelPostLikeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostLikesQuery = {
  listPostLikes?:  {
    __typename: "ModelPostLikeConnection",
    items:  Array< {
      __typename: "PostLike",
      id: string,
      postId: string,
      userId: string,
      isLike?: boolean | null,
      username: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncPostLikesQueryVariables = {
  filter?: ModelPostLikeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncPostLikesQuery = {
  syncPostLikes?:  {
    __typename: "ModelPostLikeConnection",
    items:  Array< {
      __typename: "PostLike",
      id: string,
      postId: string,
      userId: string,
      isLike?: boolean | null,
      username: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListPostLikesByPostQueryVariables = {
  postId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelPostLikeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostLikesByPostQuery = {
  listPostLikesByPost?:  {
    __typename: "ModelPostLikeConnection",
    items:  Array< {
      __typename: "PostLike",
      id: string,
      postId: string,
      userId: string,
      isLike?: boolean | null,
      username: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListPostLikesByUserQueryVariables = {
  userId: string,
  id?: ModelIDKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelPostLikeFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostLikesByUserQuery = {
  listPostLikesByUser?:  {
    __typename: "ModelPostLikeConnection",
    items:  Array< {
      __typename: "PostLike",
      id: string,
      postId: string,
      userId: string,
      isLike?: boolean | null,
      username: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetUserProfileQueryVariables = {
  id: string,
};

export type GetUserProfileQuery = {
  getUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListUserProfilesQueryVariables = {
  filter?: ModelUserProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserProfilesQuery = {
  listUserProfiles?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      id: string,
      avatar?: string | null,
      username: string,
      email?: string | null,
      followerCount?: number | null,
      followingCount?: number | null,
      postCount?: number | null,
      bio?: string | null,
      userId: string,
      sub: string,
      Posts?:  {
        __typename: "ModelPostConnection",
        items:  Array< {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      pointId: string,
      dietSettingsId?: string | null,
      mealPreferencesId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncUserProfilesQueryVariables = {
  filter?: ModelUserProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncUserProfilesQuery = {
  syncUserProfiles?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      id: string,
      avatar?: string | null,
      username: string,
      email?: string | null,
      followerCount?: number | null,
      followingCount?: number | null,
      postCount?: number | null,
      bio?: string | null,
      userId: string,
      sub: string,
      Posts?:  {
        __typename: "ModelPostConnection",
        items:  Array< {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      pointId: string,
      dietSettingsId?: string | null,
      mealPreferencesId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUserProfilesByUserNameQueryVariables = {
  username: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserProfilesByUserNameQuery = {
  listUserProfilesByUserName?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      id: string,
      avatar?: string | null,
      username: string,
      email?: string | null,
      followerCount?: number | null,
      followingCount?: number | null,
      postCount?: number | null,
      bio?: string | null,
      userId: string,
      sub: string,
      Posts?:  {
        __typename: "ModelPostConnection",
        items:  Array< {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      pointId: string,
      dietSettingsId?: string | null,
      mealPreferencesId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListUserProfilesBySubQueryVariables = {
  sub: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserProfileFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserProfilesBySubQuery = {
  listUserProfilesBySub?:  {
    __typename: "ModelUserProfileConnection",
    items:  Array< {
      __typename: "UserProfile",
      id: string,
      avatar?: string | null,
      username: string,
      email?: string | null,
      followerCount?: number | null,
      followingCount?: number | null,
      postCount?: number | null,
      bio?: string | null,
      userId: string,
      sub: string,
      Posts?:  {
        __typename: "ModelPostConnection",
        items:  Array< {
          __typename: "Post",
          id: string,
          dateDay: string,
          date: string,
          postUlid: string,
          caption?: string | null,
          image?: string | null,
          userId: string,
          likeCount?: number | null,
          commentCount?: number | null,
          avatar?: string | null,
          username: string,
          profileId: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      pointId: string,
      dietSettingsId?: string | null,
      mealPreferencesId?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetSavedPostQueryVariables = {
  id: string,
};

export type GetSavedPostQuery = {
  getSavedPost?:  {
    __typename: "SavedPost",
    id: string,
    userId: string,
    date: string,
    postId: string,
    post?:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListSavedPostsQueryVariables = {
  filter?: ModelSavedPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSavedPostsQuery = {
  listSavedPosts?:  {
    __typename: "ModelSavedPostConnection",
    items:  Array< {
      __typename: "SavedPost",
      id: string,
      userId: string,
      date: string,
      postId: string,
      post?:  {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncSavedPostsQueryVariables = {
  filter?: ModelSavedPostFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncSavedPostsQuery = {
  syncSavedPosts?:  {
    __typename: "ModelSavedPostConnection",
    items:  Array< {
      __typename: "SavedPost",
      id: string,
      userId: string,
      date: string,
      postId: string,
      post?:  {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetCommentQueryVariables = {
  id: string,
};

export type GetCommentQuery = {
  getComment?:  {
    __typename: "Comment",
    id: string,
    postId: string,
    date: string,
    content: string,
    userId: string,
    username: string,
    avatar?: string | null,
    profileId: string,
    replyId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListCommentsQueryVariables = {
  filter?: ModelCommentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListCommentsQuery = {
  listComments?:  {
    __typename: "ModelCommentConnection",
    items:  Array< {
      __typename: "Comment",
      id: string,
      postId: string,
      date: string,
      content: string,
      userId: string,
      username: string,
      avatar?: string | null,
      profileId: string,
      replyId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncCommentsQueryVariables = {
  filter?: ModelCommentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncCommentsQuery = {
  syncComments?:  {
    __typename: "ModelCommentConnection",
    items:  Array< {
      __typename: "Comment",
      id: string,
      postId: string,
      date: string,
      content: string,
      userId: string,
      username: string,
      avatar?: string | null,
      profileId: string,
      replyId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListCommentsByPostQueryVariables = {
  postId: string,
  dateId?: ModelCommentByPostCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelCommentFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListCommentsByPostQuery = {
  listCommentsByPost?:  {
    __typename: "ModelCommentConnection",
    items:  Array< {
      __typename: "Comment",
      id: string,
      postId: string,
      date: string,
      content: string,
      userId: string,
      username: string,
      avatar?: string | null,
      profileId: string,
      replyId?: string | null,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetIntegrationQueryVariables = {
  id: string,
};

export type GetIntegrationQuery = {
  getIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type ListIntegrationsQueryVariables = {
  filter?: ModelIntegrationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListIntegrationsQuery = {
  listIntegrations?:  {
    __typename: "ModelIntegrationConnection",
    items:  Array< {
      __typename: "Integration",
      id: string,
      sub: string,
      token?: string | null,
      resource?: string | null,
      resourceId?: string | null,
      name?: string | null,
      tableName?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncIntegrationsQueryVariables = {
  filter?: ModelIntegrationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncIntegrationsQuery = {
  syncIntegrations?:  {
    __typename: "ModelIntegrationConnection",
    items:  Array< {
      __typename: "Integration",
      id: string,
      sub: string,
      token?: string | null,
      resource?: string | null,
      resourceId?: string | null,
      name?: string | null,
      tableName?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type ListIntegrationsBySubQueryVariables = {
  sub: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelIntegrationFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListIntegrationsBySubQuery = {
  listIntegrationsBySub?:  {
    __typename: "ModelIntegrationConnection",
    items:  Array< {
      __typename: "Integration",
      id: string,
      sub: string,
      token?: string | null,
      resource?: string | null,
      resourceId?: string | null,
      name?: string | null,
      tableName?: string | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type GetPostTagQueryVariables = {
  id: string,
};

export type GetPostTagQuery = {
  getPostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type ListPostTagsQueryVariables = {
  filter?: ModelPostTagFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListPostTagsQuery = {
  listPostTags?:  {
    __typename: "ModelPostTagConnection",
    items:  Array< {
      __typename: "PostTag",
      id: string,
      tagID: string,
      postID: string,
      tag:  {
        __typename: "Tag",
        id: string,
        name: string,
        posts?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      },
      post:  {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      },
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type SyncPostTagsQueryVariables = {
  filter?: ModelPostTagFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  lastSync?: number | null,
};

export type SyncPostTagsQuery = {
  syncPostTags?:  {
    __typename: "ModelPostTagConnection",
    items:  Array< {
      __typename: "PostTag",
      id: string,
      tagID: string,
      postID: string,
      tag:  {
        __typename: "Tag",
        id: string,
        name: string,
        posts?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      },
      post:  {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      },
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    } | null >,
    nextToken?: string | null,
    startedAt?: number | null,
  } | null,
};

export type OnCreateFollowingSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateFollowingSubscription = {
  onCreateFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateFollowingSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateFollowingSubscription = {
  onUpdateFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteFollowingSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteFollowingSubscription = {
  onDeleteFollowing?:  {
    __typename: "Following",
    id: string,
    userId: string,
    followingProfileId: string,
    username: string,
    avatar?: string | null,
    isFollowing?: boolean | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    profileId: string,
    sub: string,
    email?: string | null,
    phoneNumber?: string | null,
    name?: string | null,
    customerId?: string | null,
    timezone?: string | null,
    onboard?: boolean | null,
    paymentCards?:  Array< {
      __typename: "Card",
      cardId?: string | null,
      cardBrand?: string | null,
      bin?: number | null,
      preferred?: boolean | null,
    } | null > | null,
    pushToken?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateGoalSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateGoalSubscription = {
  onCreateGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateGoalSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateGoalSubscription = {
  onUpdateGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteGoalSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteGoalSubscription = {
  onDeleteGoal?:  {
    __typename: "Goal",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: string | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateGoalExerciseSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateGoalExerciseSubscription = {
  onCreateGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateGoalExerciseSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateGoalExerciseSubscription = {
  onUpdateGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteGoalExerciseSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteGoalExerciseSubscription = {
  onDeleteGoalExercise?:  {
    __typename: "GoalExercise",
    id: string,
    userId: string,
    date: string,
    status: Status,
    endDate: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    scheduleId?: string | null,
    goal?: string | null,
    goalUnit?: ExerciseGoalPreference | null,
    previousWeek?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateStepDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateStepDataSubscription = {
  onCreateStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateStepDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateStepDataSubscription = {
  onUpdateStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteStepDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteStepDataSubscription = {
  onDeleteStepData?:  {
    __typename: "StepData",
    id: string,
    date: string,
    userId: string,
    steps?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateStrengthDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateStrengthDataSubscription = {
  onCreateStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateStrengthDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateStrengthDataSubscription = {
  onUpdateStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteStrengthDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteStrengthDataSubscription = {
  onDeleteStrengthData?:  {
    __typename: "StrengthData",
    id: string,
    userId: string,
    type: string,
    userIdType: string,
    date: string,
    weight: number,
    weightUnit?: string | null,
    reps?: number | null,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateEnduranceDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateEnduranceDataSubscription = {
  onCreateEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateEnduranceDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateEnduranceDataSubscription = {
  onUpdateEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteEnduranceDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteEnduranceDataSubscription = {
  onDeleteEnduranceData?:  {
    __typename: "EnduranceData",
    id: string,
    date: string,
    userId: string,
    minutes?: number | null,
    reps?: number | null,
    type: string,
    distance?: number | null,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateWeightDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateWeightDataSubscription = {
  onCreateWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateWeightDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateWeightDataSubscription = {
  onUpdateWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteWeightDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteWeightDataSubscription = {
  onDeleteWeightData?:  {
    __typename: "WeightData",
    id: string,
    date: string,
    userId: string,
    weight: number,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateNewSkillTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateNewSkillTypeDataSubscription = {
  onCreateNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateNewSkillTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateNewSkillTypeDataSubscription = {
  onUpdateNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteNewSkillTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteNewSkillTypeDataSubscription = {
  onDeleteNewSkillTypeData?:  {
    __typename: "NewSkillTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateHabitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateHabitTypeDataSubscription = {
  onCreateHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateHabitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateHabitTypeDataSubscription = {
  onUpdateHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteHabitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteHabitTypeDataSubscription = {
  onDeleteHabitTypeData?:  {
    __typename: "HabitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateLimitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateLimitTypeDataSubscription = {
  onCreateLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateLimitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateLimitTypeDataSubscription = {
  onUpdateLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteLimitTypeDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteLimitTypeDataSubscription = {
  onDeleteLimitTypeData?:  {
    __typename: "LimitTypeData",
    id: string,
    date: string,
    userId: string,
    value?: number | null,
    unit?: string | null,
    type: string,
    userIdType: string,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateMeditationDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateMeditationDataSubscription = {
  onCreateMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateMeditationDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateMeditationDataSubscription = {
  onUpdateMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteMeditationDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteMeditationDataSubscription = {
  onDeleteMeditationData?:  {
    __typename: "MeditationData",
    id: string,
    date: string,
    userId: string,
    minutes: number,
    scheduleId?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateLevelSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateLevelSubscription = {
  onCreateLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateLevelSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateLevelSubscription = {
  onUpdateLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteLevelSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteLevelSubscription = {
  onDeleteLevel?:  {
    __typename: "Level",
    id: string,
    userId: string,
    level: number,
    attempts?: number | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    date: string,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreatePointSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreatePointSubscription = {
  onCreatePoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdatePointSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdatePointSubscription = {
  onUpdatePoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeletePointSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeletePointSubscription = {
  onDeletePoint?:  {
    __typename: "Point",
    id: string,
    points?: number | null,
    currentPoints?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateUserStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateUserStatSubscription = {
  onCreateUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateUserStatSubscription = {
  onUpdateUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteUserStatSubscription = {
  onDeleteUserStat?:  {
    __typename: "UserStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userId: string,
    value: number,
    currentValue?: number | null,
    max?: number | null,
    min?: number | null,
    maxDate?: string | null,
    minDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateUserExerciseStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateUserExerciseStatSubscription = {
  onCreateUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserExerciseStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateUserExerciseStatSubscription = {
  onUpdateUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserExerciseStatSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteUserExerciseStatSubscription = {
  onDeleteUserExerciseStat?:  {
    __typename: "UserExerciseStat",
    id: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    userId: string,
    repsValue?: number | null,
    minutesValue?: number | null,
    weightValue?: number | null,
    distanceValue?: number | null,
    currentRepsValue?: number | null,
    currentMinutesValue?: number | null,
    currentDistanceValue?: number | null,
    currentWeightValue?: number | null,
    maxReps?: number | null,
    minReps?: number | null,
    maxRepsDate?: string | null,
    minRepsDate?: string | null,
    maxMinutes?: number | null,
    minMinutes?: number | null,
    maxMinutesDate?: string | null,
    minMinutesDate?: string | null,
    maxWeight?: number | null,
    minWeight?: number | null,
    maxWeightDate?: string | null,
    minWeightDate?: string | null,
    maxDistance?: number | null,
    minDistance?: number | null,
    maxDistanceDate?: string | null,
    minDistanceDate?: string | null,
    currentDate?: string | null,
    dayCount?: number | null,
    unit?: string | null,
    statPreference?: StatPreference | null,
    lastStreakStartDate?: string | null,
    lastStreakEndDate?: string | null,
    lastStreakValue?: number | null,
    bestStreakStartDate?: string | null,
    bestStreakEndDate?: string | null,
    bestStreakValue?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateDailyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateDailyToDoSubscription = {
  onCreateDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateDailyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateDailyToDoSubscription = {
  onUpdateDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteDailyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteDailyToDoSubscription = {
  onDeleteDailyToDo?:  {
    __typename: "DailyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateScheduleToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateScheduleToDoSubscription = {
  onCreateScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateScheduleToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateScheduleToDoSubscription = {
  onUpdateScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteScheduleToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteScheduleToDoSubscription = {
  onDeleteScheduleToDo?:  {
    __typename: "ScheduleToDo",
    id: string,
    taskId: string,
    status: Status,
    userId: string,
    date: string,
    dayFrequency?: number | null,
    frequency: FREQUENCY,
    interval?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    byWeekDay?: Array< Day | null > | null,
    dayReminder?: boolean | null,
    dayReminderTimeRange?: Array< string | null > | null,
    dayReminderTimes?: Array< string | null > | null,
    deadlineAlarms?: Array< string | null > | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateMasterToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateMasterToDoSubscription = {
  onCreateMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateMasterToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateMasterToDoSubscription = {
  onUpdateMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteMasterToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteMasterToDoSubscription = {
  onDeleteMasterToDo?:  {
    __typename: "MasterToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateWeeklyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateWeeklyToDoSubscription = {
  onCreateWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateWeeklyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateWeeklyToDoSubscription = {
  onUpdateWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteWeeklyToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteWeeklyToDoSubscription = {
  onDeleteWeeklyToDo?:  {
    __typename: "WeeklyToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateGroceryToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateGroceryToDoSubscription = {
  onCreateGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateGroceryToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateGroceryToDoSubscription = {
  onUpdateGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteGroceryToDoSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteGroceryToDoSubscription = {
  onDeleteGroceryToDo?:  {
    __typename: "GroceryToDo",
    id: string,
    userId: string,
    notes?: string | null,
    completed?: boolean | null,
    startDate?: string | null,
    endDate?: string | null,
    completedDate?: string | null,
    nextDay?: boolean | null,
    important?: boolean | null,
    date?: string | null,
    event?: boolean | null,
    scheduleId?: string | null,
    softDeadline?: string | null,
    hardDeadline?: string | null,
    recurring?: boolean | null,
    syncId?: string | null,
    syncName?: string | null,
    status?: ToDoStatus | null,
    parentId?: string | null,
    location?: string | null,
    tags?: Array< string | null > | null,
    heading?: string | null,
    order?: number | null,
    eventId?: string | null,
    duration?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateScheduleSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateScheduleSubscription = {
  onCreateSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateScheduleSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateScheduleSubscription = {
  onUpdateSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteScheduleSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteScheduleSubscription = {
  onDeleteSchedule?:  {
    __typename: "Schedule",
    id: string,
    primaryGoalType?: PrimaryGoalType | null,
    secondaryGoalType?: string | null,
    status: Status,
    userId: string,
    date: string,
    userIdGoal: string,
    unit?: string | null,
    ttl?: number | null,
    eventId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateStreakSubscriptionVariables = {
  trainerId?: string | null,
};

export type OnCreateStreakSubscription = {
  onCreateStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type OnUpdateStreakSubscriptionVariables = {
  trainerId?: string | null,
};

export type OnUpdateStreakSubscription = {
  onUpdateStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type OnDeleteStreakSubscriptionVariables = {
  trainerId?: string | null,
};

export type OnDeleteStreakSubscription = {
  onDeleteStreak?:  {
    __typename: "Streak",
    id: string,
    dataType?: string | null,
    goalId?: string | null,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string | null,
    userIdGoal: string,
    userId: string,
    streak?: number | null,
    startDate: string,
    endDate?: string | null,
    lastSyncDate?: string | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    trainerId?: string | null,
  } | null,
};

export type OnCreateRoutineDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateRoutineDataSubscription = {
  onCreateRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateRoutineDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateRoutineDataSubscription = {
  onUpdateRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteRoutineDataSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteRoutineDataSubscription = {
  onDeleteRoutineData?:  {
    __typename: "RoutineData",
    id: string,
    userId: string,
    date: string,
    userIdType: string,
    type: string,
    rest?: number | null,
    ttl?: number | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateUserActivateTypeSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateUserActivateTypeSubscription = {
  onCreateUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserActivateTypeSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateUserActivateTypeSubscription = {
  onUpdateUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserActivateTypeSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteUserActivateTypeSubscription = {
  onDeleteUserActivateType?:  {
    __typename: "UserActivateType",
    id: string,
    userId: string,
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    activated: boolean,
    secondaryGoalName?: string | null,
    routineId?: string | null,
    exerciseId?: string | null,
    unit?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateUserProfileSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateUserProfileSubscription = {
  onCreateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserProfileSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateUserProfileSubscription = {
  onUpdateUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserProfileSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteUserProfileSubscription = {
  onDeleteUserProfile?:  {
    __typename: "UserProfile",
    id: string,
    avatar?: string | null,
    username: string,
    email?: string | null,
    followerCount?: number | null,
    followingCount?: number | null,
    postCount?: number | null,
    bio?: string | null,
    userId: string,
    sub: string,
    Posts?:  {
      __typename: "ModelPostConnection",
      items:  Array< {
        __typename: "Post",
        id: string,
        dateDay: string,
        date: string,
        postUlid: string,
        caption?: string | null,
        tags?:  {
          __typename: "ModelPostTagConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        image?: string | null,
        userId: string,
        likes?:  {
          __typename: "ModelPostLikeConnection",
          nextToken?: string | null,
          startedAt?: number | null,
        } | null,
        likeCount?: number | null,
        commentCount?: number | null,
        avatar?: string | null,
        username: string,
        profileId: string,
        ttl?: number | null,
        createdAt: string,
        updatedAt: string,
        _version: number,
        _deleted?: boolean | null,
        _lastChangedAt: number,
      } | null >,
      nextToken?: string | null,
      startedAt?: number | null,
    } | null,
    pointId: string,
    dietSettingsId?: string | null,
    mealPreferencesId?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreateIntegrationSubscriptionVariables = {
  owner?: string | null,
};

export type OnCreateIntegrationSubscription = {
  onCreateIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnUpdateIntegrationSubscriptionVariables = {
  owner?: string | null,
};

export type OnUpdateIntegrationSubscription = {
  onUpdateIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnDeleteIntegrationSubscriptionVariables = {
  owner?: string | null,
};

export type OnDeleteIntegrationSubscription = {
  onDeleteIntegration?:  {
    __typename: "Integration",
    id: string,
    sub: string,
    token?: string | null,
    resource?: string | null,
    resourceId?: string | null,
    name?: string | null,
    tableName?: string | null,
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
    owner?: string | null,
  } | null,
};

export type OnCreatePostTagSubscription = {
  onCreatePostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type OnUpdatePostTagSubscription = {
  onUpdatePostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};

export type OnDeletePostTagSubscription = {
  onDeletePostTag?:  {
    __typename: "PostTag",
    id: string,
    tagID: string,
    postID: string,
    tag:  {
      __typename: "Tag",
      id: string,
      name: string,
      posts?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    post:  {
      __typename: "Post",
      id: string,
      dateDay: string,
      date: string,
      postUlid: string,
      caption?: string | null,
      tags?:  {
        __typename: "ModelPostTagConnection",
        items:  Array< {
          __typename: "PostTag",
          id: string,
          tagID: string,
          postID: string,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      image?: string | null,
      userId: string,
      likes?:  {
        __typename: "ModelPostLikeConnection",
        items:  Array< {
          __typename: "PostLike",
          id: string,
          postId: string,
          userId: string,
          isLike?: boolean | null,
          username: string,
          ttl?: number | null,
          createdAt: string,
          updatedAt: string,
          _version: number,
          _deleted?: boolean | null,
          _lastChangedAt: number,
          owner?: string | null,
        } | null >,
        nextToken?: string | null,
        startedAt?: number | null,
      } | null,
      likeCount?: number | null,
      commentCount?: number | null,
      avatar?: string | null,
      username: string,
      profileId: string,
      ttl?: number | null,
      createdAt: string,
      updatedAt: string,
      _version: number,
      _deleted?: boolean | null,
      _lastChangedAt: number,
    },
    createdAt: string,
    updatedAt: string,
    _version: number,
    _deleted?: boolean | null,
    _lastChangedAt: number,
  } | null,
};
