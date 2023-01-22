/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createActivity = /* GraphQL */ `
  mutation CreateActivity(
    $input: CreateActivityInput!
    $condition: ModelActivityConditionInput
  ) {
    createActivity(input: $input, condition: $condition) {
      id
      userId
      date
      senderId
      activity
      objectId
      sendername
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateActivity = /* GraphQL */ `
  mutation UpdateActivity(
    $input: UpdateActivityInput!
    $condition: ModelActivityConditionInput
  ) {
    updateActivity(input: $input, condition: $condition) {
      id
      userId
      date
      senderId
      activity
      objectId
      sendername
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteActivity = /* GraphQL */ `
  mutation DeleteActivity(
    $input: DeleteActivityInput!
    $condition: ModelActivityConditionInput
  ) {
    deleteActivity(input: $input, condition: $condition) {
      id
      userId
      date
      senderId
      activity
      objectId
      sendername
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createFollower = /* GraphQL */ `
  mutation CreateFollower(
    $input: CreateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    createFollower(input: $input, condition: $condition) {
      id
      userId
      followerProfileId
      avatar
      isFollower
      username
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateFollower = /* GraphQL */ `
  mutation UpdateFollower(
    $input: UpdateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    updateFollower(input: $input, condition: $condition) {
      id
      userId
      followerProfileId
      avatar
      isFollower
      username
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteFollower = /* GraphQL */ `
  mutation DeleteFollower(
    $input: DeleteFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    deleteFollower(input: $input, condition: $condition) {
      id
      userId
      followerProfileId
      avatar
      isFollower
      username
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createFollowing = /* GraphQL */ `
  mutation CreateFollowing(
    $input: CreateFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    createFollowing(input: $input, condition: $condition) {
      id
      userId
      followingProfileId
      username
      avatar
      isFollowing
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateFollowing = /* GraphQL */ `
  mutation UpdateFollowing(
    $input: UpdateFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    updateFollowing(input: $input, condition: $condition) {
      id
      userId
      followingProfileId
      username
      avatar
      isFollowing
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteFollowing = /* GraphQL */ `
  mutation DeleteFollowing(
    $input: DeleteFollowingInput!
    $condition: ModelFollowingConditionInput
  ) {
    deleteFollowing(input: $input, condition: $condition) {
      id
      userId
      followingProfileId
      username
      avatar
      isFollowing
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
      profileId
      sub
      email
      phoneNumber
      name
      customerId
      timezone
      onboard
      paymentCards {
        cardId
        cardBrand
        bin
        preferred
      }
      pushToken
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
      id
      profileId
      sub
      email
      phoneNumber
      name
      customerId
      timezone
      onboard
      paymentCards {
        cardId
        cardBrand
        bin
        preferred
      }
      pushToken
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
      id
      profileId
      sub
      email
      phoneNumber
      name
      customerId
      timezone
      onboard
      paymentCards {
        cardId
        cardBrand
        bin
        preferred
      }
      pushToken
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createGoal = /* GraphQL */ `
  mutation CreateGoal(
    $input: CreateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    createGoal(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateGoal = /* GraphQL */ `
  mutation UpdateGoal(
    $input: UpdateGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    updateGoal(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteGoal = /* GraphQL */ `
  mutation DeleteGoal(
    $input: DeleteGoalInput!
    $condition: ModelGoalConditionInput
  ) {
    deleteGoal(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createGoalExercise = /* GraphQL */ `
  mutation CreateGoalExercise(
    $input: CreateGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    createGoalExercise(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateGoalExercise = /* GraphQL */ `
  mutation UpdateGoalExercise(
    $input: UpdateGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    updateGoalExercise(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteGoalExercise = /* GraphQL */ `
  mutation DeleteGoalExercise(
    $input: DeleteGoalExerciseInput!
    $condition: ModelGoalExerciseConditionInput
  ) {
    deleteGoalExercise(input: $input, condition: $condition) {
      id
      userId
      date
      status
      endDate
      primaryGoalType
      secondaryGoalType
      scheduleId
      goal
      goalUnit
      previousWeek
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createStepData = /* GraphQL */ `
  mutation CreateStepData(
    $input: CreateStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    createStepData(input: $input, condition: $condition) {
      id
      date
      userId
      steps
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateStepData = /* GraphQL */ `
  mutation UpdateStepData(
    $input: UpdateStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    updateStepData(input: $input, condition: $condition) {
      id
      date
      userId
      steps
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteStepData = /* GraphQL */ `
  mutation DeleteStepData(
    $input: DeleteStepDataInput!
    $condition: ModelStepDataConditionInput
  ) {
    deleteStepData(input: $input, condition: $condition) {
      id
      date
      userId
      steps
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createStrengthData = /* GraphQL */ `
  mutation CreateStrengthData(
    $input: CreateStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    createStrengthData(input: $input, condition: $condition) {
      id
      userId
      type
      userIdType
      date
      weight
      weightUnit
      reps
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateStrengthData = /* GraphQL */ `
  mutation UpdateStrengthData(
    $input: UpdateStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    updateStrengthData(input: $input, condition: $condition) {
      id
      userId
      type
      userIdType
      date
      weight
      weightUnit
      reps
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteStrengthData = /* GraphQL */ `
  mutation DeleteStrengthData(
    $input: DeleteStrengthDataInput!
    $condition: ModelStrengthDataConditionInput
  ) {
    deleteStrengthData(input: $input, condition: $condition) {
      id
      userId
      type
      userIdType
      date
      weight
      weightUnit
      reps
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createEnduranceData = /* GraphQL */ `
  mutation CreateEnduranceData(
    $input: CreateEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    createEnduranceData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      reps
      type
      distance
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateEnduranceData = /* GraphQL */ `
  mutation UpdateEnduranceData(
    $input: UpdateEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    updateEnduranceData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      reps
      type
      distance
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteEnduranceData = /* GraphQL */ `
  mutation DeleteEnduranceData(
    $input: DeleteEnduranceDataInput!
    $condition: ModelEnduranceDataConditionInput
  ) {
    deleteEnduranceData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      reps
      type
      distance
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createWeightData = /* GraphQL */ `
  mutation CreateWeightData(
    $input: CreateWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    createWeightData(input: $input, condition: $condition) {
      id
      date
      userId
      weight
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateWeightData = /* GraphQL */ `
  mutation UpdateWeightData(
    $input: UpdateWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    updateWeightData(input: $input, condition: $condition) {
      id
      date
      userId
      weight
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteWeightData = /* GraphQL */ `
  mutation DeleteWeightData(
    $input: DeleteWeightDataInput!
    $condition: ModelWeightDataConditionInput
  ) {
    deleteWeightData(input: $input, condition: $condition) {
      id
      date
      userId
      weight
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createNewSkillTypeData = /* GraphQL */ `
  mutation CreateNewSkillTypeData(
    $input: CreateNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    createNewSkillTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateNewSkillTypeData = /* GraphQL */ `
  mutation UpdateNewSkillTypeData(
    $input: UpdateNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    updateNewSkillTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteNewSkillTypeData = /* GraphQL */ `
  mutation DeleteNewSkillTypeData(
    $input: DeleteNewSkillTypeDataInput!
    $condition: ModelNewSkillTypeDataConditionInput
  ) {
    deleteNewSkillTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createHabitTypeData = /* GraphQL */ `
  mutation CreateHabitTypeData(
    $input: CreateHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    createHabitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateHabitTypeData = /* GraphQL */ `
  mutation UpdateHabitTypeData(
    $input: UpdateHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    updateHabitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteHabitTypeData = /* GraphQL */ `
  mutation DeleteHabitTypeData(
    $input: DeleteHabitTypeDataInput!
    $condition: ModelHabitTypeDataConditionInput
  ) {
    deleteHabitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createLimitTypeData = /* GraphQL */ `
  mutation CreateLimitTypeData(
    $input: CreateLimitTypeDataInput!
    $condition: ModelLimitTypeDataConditionInput
  ) {
    createLimitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateLimitTypeData = /* GraphQL */ `
  mutation UpdateLimitTypeData(
    $input: UpdateLimitTypeDataInput!
    $condition: ModelLimitTypeDataConditionInput
  ) {
    updateLimitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteLimitTypeData = /* GraphQL */ `
  mutation DeleteLimitTypeData(
    $input: DeleteLimitTypeDataInput!
    $condition: ModelLimitTypeDataConditionInput
  ) {
    deleteLimitTypeData(input: $input, condition: $condition) {
      id
      date
      userId
      value
      unit
      type
      userIdType
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createMeditationData = /* GraphQL */ `
  mutation CreateMeditationData(
    $input: CreateMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    createMeditationData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateMeditationData = /* GraphQL */ `
  mutation UpdateMeditationData(
    $input: UpdateMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    updateMeditationData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteMeditationData = /* GraphQL */ `
  mutation DeleteMeditationData(
    $input: DeleteMeditationDataInput!
    $condition: ModelMeditationDataConditionInput
  ) {
    deleteMeditationData(input: $input, condition: $condition) {
      id
      date
      userId
      minutes
      scheduleId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createLevel = /* GraphQL */ `
  mutation CreateLevel(
    $input: CreateLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    createLevel(input: $input, condition: $condition) {
      id
      userId
      level
      attempts
      primaryGoalType
      secondaryGoalType
      date
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateLevel = /* GraphQL */ `
  mutation UpdateLevel(
    $input: UpdateLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    updateLevel(input: $input, condition: $condition) {
      id
      userId
      level
      attempts
      primaryGoalType
      secondaryGoalType
      date
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteLevel = /* GraphQL */ `
  mutation DeleteLevel(
    $input: DeleteLevelInput!
    $condition: ModelLevelConditionInput
  ) {
    deleteLevel(input: $input, condition: $condition) {
      id
      userId
      level
      attempts
      primaryGoalType
      secondaryGoalType
      date
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createPoint = /* GraphQL */ `
  mutation CreatePoint(
    $input: CreatePointInput!
    $condition: ModelPointConditionInput
  ) {
    createPoint(input: $input, condition: $condition) {
      id
      points
      currentPoints
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updatePoint = /* GraphQL */ `
  mutation UpdatePoint(
    $input: UpdatePointInput!
    $condition: ModelPointConditionInput
  ) {
    updatePoint(input: $input, condition: $condition) {
      id
      points
      currentPoints
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deletePoint = /* GraphQL */ `
  mutation DeletePoint(
    $input: DeletePointInput!
    $condition: ModelPointConditionInput
  ) {
    deletePoint(input: $input, condition: $condition) {
      id
      points
      currentPoints
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createUserStat = /* GraphQL */ `
  mutation CreateUserStat(
    $input: CreateUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    createUserStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      value
      currentValue
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateUserStat = /* GraphQL */ `
  mutation UpdateUserStat(
    $input: UpdateUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    updateUserStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      value
      currentValue
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteUserStat = /* GraphQL */ `
  mutation DeleteUserStat(
    $input: DeleteUserStatInput!
    $condition: ModelUserStatConditionInput
  ) {
    deleteUserStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      value
      currentValue
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createExerciseRoutine = /* GraphQL */ `
  mutation CreateExerciseRoutine(
    $input: CreateExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    createExerciseRoutine(input: $input, condition: $condition) {
      id
      routineId
      exerciseId
      routine {
        id
        name
        nId
        description
        exercises {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      exercise {
        id
        name
        nId
        type
        description
        routines {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updateExerciseRoutine = /* GraphQL */ `
  mutation UpdateExerciseRoutine(
    $input: UpdateExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    updateExerciseRoutine(input: $input, condition: $condition) {
      id
      routineId
      exerciseId
      routine {
        id
        name
        nId
        description
        exercises {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      exercise {
        id
        name
        nId
        type
        description
        routines {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deleteExerciseRoutine = /* GraphQL */ `
  mutation DeleteExerciseRoutine(
    $input: DeleteExerciseRoutineInput!
    $condition: ModelExerciseRoutineConditionInput
  ) {
    deleteExerciseRoutine(input: $input, condition: $condition) {
      id
      routineId
      exerciseId
      routine {
        id
        name
        nId
        description
        exercises {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      exercise {
        id
        name
        nId
        type
        description
        routines {
          items {
            id
            routineId
            exerciseId
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const createRoutine = /* GraphQL */ `
  mutation CreateRoutine(
    $input: CreateRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    createRoutine(input: $input, condition: $condition) {
      id
      name
      nId
      description
      exercises {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updateRoutine = /* GraphQL */ `
  mutation UpdateRoutine(
    $input: UpdateRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    updateRoutine(input: $input, condition: $condition) {
      id
      name
      nId
      description
      exercises {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deleteRoutine = /* GraphQL */ `
  mutation DeleteRoutine(
    $input: DeleteRoutineInput!
    $condition: ModelRoutineConditionInput
  ) {
    deleteRoutine(input: $input, condition: $condition) {
      id
      name
      nId
      description
      exercises {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const createExercise = /* GraphQL */ `
  mutation CreateExercise(
    $input: CreateExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    createExercise(input: $input, condition: $condition) {
      id
      name
      nId
      type
      description
      routines {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updateExercise = /* GraphQL */ `
  mutation UpdateExercise(
    $input: UpdateExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    updateExercise(input: $input, condition: $condition) {
      id
      name
      nId
      type
      description
      routines {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deleteExercise = /* GraphQL */ `
  mutation DeleteExercise(
    $input: DeleteExerciseInput!
    $condition: ModelExerciseConditionInput
  ) {
    deleteExercise(input: $input, condition: $condition) {
      id
      name
      nId
      type
      description
      routines {
        items {
          id
          routineId
          exerciseId
          routine {
            id
            name
            nId
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const createUserExerciseStat = /* GraphQL */ `
  mutation CreateUserExerciseStat(
    $input: CreateUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    createUserExerciseStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      repsValue
      minutesValue
      weightValue
      distanceValue
      currentRepsValue
      currentMinutesValue
      currentDistanceValue
      currentWeightValue
      maxReps
      minReps
      maxRepsDate
      minRepsDate
      maxMinutes
      minMinutes
      maxMinutesDate
      minMinutesDate
      maxWeight
      minWeight
      maxWeightDate
      minWeightDate
      maxDistance
      minDistance
      maxDistanceDate
      minDistanceDate
      currentDate
      dayCount
      unit
      statPreference
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateUserExerciseStat = /* GraphQL */ `
  mutation UpdateUserExerciseStat(
    $input: UpdateUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    updateUserExerciseStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      repsValue
      minutesValue
      weightValue
      distanceValue
      currentRepsValue
      currentMinutesValue
      currentDistanceValue
      currentWeightValue
      maxReps
      minReps
      maxRepsDate
      minRepsDate
      maxMinutes
      minMinutes
      maxMinutesDate
      minMinutesDate
      maxWeight
      minWeight
      maxWeightDate
      minWeightDate
      maxDistance
      minDistance
      maxDistanceDate
      minDistanceDate
      currentDate
      dayCount
      unit
      statPreference
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteUserExerciseStat = /* GraphQL */ `
  mutation DeleteUserExerciseStat(
    $input: DeleteUserExerciseStatInput!
    $condition: ModelUserExerciseStatConditionInput
  ) {
    deleteUserExerciseStat(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      userId
      repsValue
      minutesValue
      weightValue
      distanceValue
      currentRepsValue
      currentMinutesValue
      currentDistanceValue
      currentWeightValue
      maxReps
      minReps
      maxRepsDate
      minRepsDate
      maxMinutes
      minMinutes
      maxMinutesDate
      minMinutesDate
      maxWeight
      minWeight
      maxWeightDate
      minWeightDate
      maxDistance
      minDistance
      maxDistanceDate
      minDistanceDate
      currentDate
      dayCount
      unit
      statPreference
      lastStreakStartDate
      lastStreakEndDate
      lastStreakValue
      bestStreakStartDate
      bestStreakEndDate
      bestStreakValue
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createDailyToDo = /* GraphQL */ `
  mutation CreateDailyToDo(
    $input: CreateDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    createDailyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateDailyToDo = /* GraphQL */ `
  mutation UpdateDailyToDo(
    $input: UpdateDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    updateDailyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteDailyToDo = /* GraphQL */ `
  mutation DeleteDailyToDo(
    $input: DeleteDailyToDoInput!
    $condition: ModelDailyToDoConditionInput
  ) {
    deleteDailyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createScheduleToDo = /* GraphQL */ `
  mutation CreateScheduleToDo(
    $input: CreateScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    createScheduleToDo(input: $input, condition: $condition) {
      id
      taskId
      status
      userId
      date
      dayFrequency
      frequency
      interval
      startDate
      endDate
      byWeekDay
      dayReminder
      dayReminderTimeRange
      dayReminderTimes
      deadlineAlarms
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateScheduleToDo = /* GraphQL */ `
  mutation UpdateScheduleToDo(
    $input: UpdateScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    updateScheduleToDo(input: $input, condition: $condition) {
      id
      taskId
      status
      userId
      date
      dayFrequency
      frequency
      interval
      startDate
      endDate
      byWeekDay
      dayReminder
      dayReminderTimeRange
      dayReminderTimes
      deadlineAlarms
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteScheduleToDo = /* GraphQL */ `
  mutation DeleteScheduleToDo(
    $input: DeleteScheduleToDoInput!
    $condition: ModelScheduleToDoConditionInput
  ) {
    deleteScheduleToDo(input: $input, condition: $condition) {
      id
      taskId
      status
      userId
      date
      dayFrequency
      frequency
      interval
      startDate
      endDate
      byWeekDay
      dayReminder
      dayReminderTimeRange
      dayReminderTimes
      deadlineAlarms
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createMasterToDo = /* GraphQL */ `
  mutation CreateMasterToDo(
    $input: CreateMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    createMasterToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateMasterToDo = /* GraphQL */ `
  mutation UpdateMasterToDo(
    $input: UpdateMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    updateMasterToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteMasterToDo = /* GraphQL */ `
  mutation DeleteMasterToDo(
    $input: DeleteMasterToDoInput!
    $condition: ModelMasterToDoConditionInput
  ) {
    deleteMasterToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createWeeklyToDo = /* GraphQL */ `
  mutation CreateWeeklyToDo(
    $input: CreateWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    createWeeklyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateWeeklyToDo = /* GraphQL */ `
  mutation UpdateWeeklyToDo(
    $input: UpdateWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    updateWeeklyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteWeeklyToDo = /* GraphQL */ `
  mutation DeleteWeeklyToDo(
    $input: DeleteWeeklyToDoInput!
    $condition: ModelWeeklyToDoConditionInput
  ) {
    deleteWeeklyToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createGroceryToDo = /* GraphQL */ `
  mutation CreateGroceryToDo(
    $input: CreateGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    createGroceryToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateGroceryToDo = /* GraphQL */ `
  mutation UpdateGroceryToDo(
    $input: UpdateGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    updateGroceryToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteGroceryToDo = /* GraphQL */ `
  mutation DeleteGroceryToDo(
    $input: DeleteGroceryToDoInput!
    $condition: ModelGroceryToDoConditionInput
  ) {
    deleteGroceryToDo(input: $input, condition: $condition) {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createSchedule = /* GraphQL */ `
  mutation CreateSchedule(
    $input: CreateScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    createSchedule(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      status
      userId
      date
      userIdGoal
      unit
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateSchedule = /* GraphQL */ `
  mutation UpdateSchedule(
    $input: UpdateScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    updateSchedule(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      status
      userId
      date
      userIdGoal
      unit
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteSchedule = /* GraphQL */ `
  mutation DeleteSchedule(
    $input: DeleteScheduleInput!
    $condition: ModelScheduleConditionInput
  ) {
    deleteSchedule(input: $input, condition: $condition) {
      id
      primaryGoalType
      secondaryGoalType
      status
      userId
      date
      userIdGoal
      unit
      ttl
      eventId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createStreak = /* GraphQL */ `
  mutation CreateStreak(
    $input: CreateStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    createStreak(input: $input, condition: $condition) {
      id
      dataType
      goalId
      primaryGoalType
      secondaryGoalType
      userIdGoal
      userId
      streak
      startDate
      endDate
      lastSyncDate
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      trainerId
    }
  }
`;
export const updateStreak = /* GraphQL */ `
  mutation UpdateStreak(
    $input: UpdateStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    updateStreak(input: $input, condition: $condition) {
      id
      dataType
      goalId
      primaryGoalType
      secondaryGoalType
      userIdGoal
      userId
      streak
      startDate
      endDate
      lastSyncDate
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      trainerId
    }
  }
`;
export const deleteStreak = /* GraphQL */ `
  mutation DeleteStreak(
    $input: DeleteStreakInput!
    $condition: ModelStreakConditionInput
  ) {
    deleteStreak(input: $input, condition: $condition) {
      id
      dataType
      goalId
      primaryGoalType
      secondaryGoalType
      userIdGoal
      userId
      streak
      startDate
      endDate
      lastSyncDate
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      trainerId
    }
  }
`;
export const createRoutineData = /* GraphQL */ `
  mutation CreateRoutineData(
    $input: CreateRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    createRoutineData(input: $input, condition: $condition) {
      id
      userId
      date
      userIdType
      type
      rest
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateRoutineData = /* GraphQL */ `
  mutation UpdateRoutineData(
    $input: UpdateRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    updateRoutineData(input: $input, condition: $condition) {
      id
      userId
      date
      userIdType
      type
      rest
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteRoutineData = /* GraphQL */ `
  mutation DeleteRoutineData(
    $input: DeleteRoutineDataInput!
    $condition: ModelRoutineDataConditionInput
  ) {
    deleteRoutineData(input: $input, condition: $condition) {
      id
      userId
      date
      userIdType
      type
      rest
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createUserActivateType = /* GraphQL */ `
  mutation CreateUserActivateType(
    $input: CreateUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    createUserActivateType(input: $input, condition: $condition) {
      id
      userId
      primaryGoalType
      secondaryGoalType
      activated
      secondaryGoalName
      routineId
      exerciseId
      unit
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateUserActivateType = /* GraphQL */ `
  mutation UpdateUserActivateType(
    $input: UpdateUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    updateUserActivateType(input: $input, condition: $condition) {
      id
      userId
      primaryGoalType
      secondaryGoalType
      activated
      secondaryGoalName
      routineId
      exerciseId
      unit
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteUserActivateType = /* GraphQL */ `
  mutation DeleteUserActivateType(
    $input: DeleteUserActivateTypeInput!
    $condition: ModelUserActivateTypeConditionInput
  ) {
    deleteUserActivateType(input: $input, condition: $condition) {
      id
      userId
      primaryGoalType
      secondaryGoalType
      activated
      secondaryGoalName
      routineId
      exerciseId
      unit
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createTag = /* GraphQL */ `
  mutation CreateTag(
    $input: CreateTagInput!
    $condition: ModelTagConditionInput
  ) {
    createTag(input: $input, condition: $condition) {
      id
      name
      posts {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updateTag = /* GraphQL */ `
  mutation UpdateTag(
    $input: UpdateTagInput!
    $condition: ModelTagConditionInput
  ) {
    updateTag(input: $input, condition: $condition) {
      id
      name
      posts {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deleteTag = /* GraphQL */ `
  mutation DeleteTag(
    $input: DeleteTagInput!
    $condition: ModelTagConditionInput
  ) {
    deleteTag(input: $input, condition: $condition) {
      id
      name
      posts {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      dateDay
      date
      postUlid
      caption
      tags {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      image
      userId
      likes {
        items {
          id
          postId
          userId
          isLike
          username
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
          owner
        }
        nextToken
        startedAt
      }
      likeCount
      commentCount
      avatar
      username
      profileId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      dateDay
      date
      postUlid
      caption
      tags {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      image
      userId
      likes {
        items {
          id
          postId
          userId
          isLike
          username
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
          owner
        }
        nextToken
        startedAt
      }
      likeCount
      commentCount
      avatar
      username
      profileId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
      id
      dateDay
      date
      postUlid
      caption
      tags {
        items {
          id
          tagID
          postID
          tag {
            id
            name
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          post {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      image
      userId
      likes {
        items {
          id
          postId
          userId
          isLike
          username
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
          owner
        }
        nextToken
        startedAt
      }
      likeCount
      commentCount
      avatar
      username
      profileId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const createPostLike = /* GraphQL */ `
  mutation CreatePostLike(
    $input: CreatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    createPostLike(input: $input, condition: $condition) {
      id
      postId
      userId
      isLike
      username
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updatePostLike = /* GraphQL */ `
  mutation UpdatePostLike(
    $input: UpdatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    updatePostLike(input: $input, condition: $condition) {
      id
      postId
      userId
      isLike
      username
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deletePostLike = /* GraphQL */ `
  mutation DeletePostLike(
    $input: DeletePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    deletePostLike(input: $input, condition: $condition) {
      id
      postId
      userId
      isLike
      username
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createUserProfile = /* GraphQL */ `
  mutation CreateUserProfile(
    $input: CreateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    createUserProfile(input: $input, condition: $condition) {
      id
      avatar
      username
      email
      followerCount
      followingCount
      postCount
      bio
      userId
      sub
      Posts {
        items {
          id
          dateDay
          date
          postUlid
          caption
          tags {
            nextToken
            startedAt
          }
          image
          userId
          likes {
            nextToken
            startedAt
          }
          likeCount
          commentCount
          avatar
          username
          profileId
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      pointId
      dietSettingsId
      mealPreferencesId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateUserProfile = /* GraphQL */ `
  mutation UpdateUserProfile(
    $input: UpdateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    updateUserProfile(input: $input, condition: $condition) {
      id
      avatar
      username
      email
      followerCount
      followingCount
      postCount
      bio
      userId
      sub
      Posts {
        items {
          id
          dateDay
          date
          postUlid
          caption
          tags {
            nextToken
            startedAt
          }
          image
          userId
          likes {
            nextToken
            startedAt
          }
          likeCount
          commentCount
          avatar
          username
          profileId
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      pointId
      dietSettingsId
      mealPreferencesId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteUserProfile = /* GraphQL */ `
  mutation DeleteUserProfile(
    $input: DeleteUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    deleteUserProfile(input: $input, condition: $condition) {
      id
      avatar
      username
      email
      followerCount
      followingCount
      postCount
      bio
      userId
      sub
      Posts {
        items {
          id
          dateDay
          date
          postUlid
          caption
          tags {
            nextToken
            startedAt
          }
          image
          userId
          likes {
            nextToken
            startedAt
          }
          likeCount
          commentCount
          avatar
          username
          profileId
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      pointId
      dietSettingsId
      mealPreferencesId
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createSavedPost = /* GraphQL */ `
  mutation CreateSavedPost(
    $input: CreateSavedPostInput!
    $condition: ModelSavedPostConditionInput
  ) {
    createSavedPost(input: $input, condition: $condition) {
      id
      userId
      date
      postId
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateSavedPost = /* GraphQL */ `
  mutation UpdateSavedPost(
    $input: UpdateSavedPostInput!
    $condition: ModelSavedPostConditionInput
  ) {
    updateSavedPost(input: $input, condition: $condition) {
      id
      userId
      date
      postId
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteSavedPost = /* GraphQL */ `
  mutation DeleteSavedPost(
    $input: DeleteSavedPostInput!
    $condition: ModelSavedPostConditionInput
  ) {
    deleteSavedPost(input: $input, condition: $condition) {
      id
      userId
      date
      postId
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createComment = /* GraphQL */ `
  mutation CreateComment(
    $input: CreateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    createComment(input: $input, condition: $condition) {
      id
      postId
      date
      content
      userId
      username
      avatar
      profileId
      replyId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateComment = /* GraphQL */ `
  mutation UpdateComment(
    $input: UpdateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    updateComment(input: $input, condition: $condition) {
      id
      postId
      date
      content
      userId
      username
      avatar
      profileId
      replyId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteComment = /* GraphQL */ `
  mutation DeleteComment(
    $input: DeleteCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    deleteComment(input: $input, condition: $condition) {
      id
      postId
      date
      content
      userId
      username
      avatar
      profileId
      replyId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createIntegration = /* GraphQL */ `
  mutation CreateIntegration(
    $input: CreateIntegrationInput!
    $condition: ModelIntegrationConditionInput
  ) {
    createIntegration(input: $input, condition: $condition) {
      id
      sub
      token
      resource
      resourceId
      name
      tableName
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const updateIntegration = /* GraphQL */ `
  mutation UpdateIntegration(
    $input: UpdateIntegrationInput!
    $condition: ModelIntegrationConditionInput
  ) {
    updateIntegration(input: $input, condition: $condition) {
      id
      sub
      token
      resource
      resourceId
      name
      tableName
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const deleteIntegration = /* GraphQL */ `
  mutation DeleteIntegration(
    $input: DeleteIntegrationInput!
    $condition: ModelIntegrationConditionInput
  ) {
    deleteIntegration(input: $input, condition: $condition) {
      id
      sub
      token
      resource
      resourceId
      name
      tableName
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      owner
    }
  }
`;
export const createPostTag = /* GraphQL */ `
  mutation CreatePostTag(
    $input: CreatePostTagInput!
    $condition: ModelPostTagConditionInput
  ) {
    createPostTag(input: $input, condition: $condition) {
      id
      tagID
      postID
      tag {
        id
        name
        posts {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const updatePostTag = /* GraphQL */ `
  mutation UpdatePostTag(
    $input: UpdatePostTagInput!
    $condition: ModelPostTagConditionInput
  ) {
    updatePostTag(input: $input, condition: $condition) {
      id
      tagID
      postID
      tag {
        id
        name
        posts {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
export const deletePostTag = /* GraphQL */ `
  mutation DeletePostTag(
    $input: DeletePostTagInput!
    $condition: ModelPostTagConditionInput
  ) {
    deletePostTag(input: $input, condition: $condition) {
      id
      tagID
      postID
      tag {
        id
        name
        posts {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      post {
        id
        dateDay
        date
        postUlid
        caption
        tags {
          items {
            id
            tagID
            postID
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
          }
          nextToken
          startedAt
        }
        image
        userId
        likes {
          items {
            id
            postId
            userId
            isLike
            username
            ttl
            createdAt
            updatedAt
            _version
            _deleted
            _lastChangedAt
            owner
          }
          nextToken
          startedAt
        }
        likeCount
        commentCount
        avatar
        username
        profileId
        ttl
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
