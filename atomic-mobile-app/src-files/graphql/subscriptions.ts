/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateFollowing = /* GraphQL */ `
  subscription OnCreateFollowing($owner: String) {
    onCreateFollowing(owner: $owner) {
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
export const onUpdateFollowing = /* GraphQL */ `
  subscription OnUpdateFollowing($owner: String) {
    onUpdateFollowing(owner: $owner) {
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
export const onDeleteFollowing = /* GraphQL */ `
  subscription OnDeleteFollowing($owner: String) {
    onDeleteFollowing(owner: $owner) {
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
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($owner: String) {
    onCreateUser(owner: $owner) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($owner: String) {
    onUpdateUser(owner: $owner) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($owner: String) {
    onDeleteUser(owner: $owner) {
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
export const onCreateGoal = /* GraphQL */ `
  subscription OnCreateGoal($owner: String) {
    onCreateGoal(owner: $owner) {
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
export const onUpdateGoal = /* GraphQL */ `
  subscription OnUpdateGoal($owner: String) {
    onUpdateGoal(owner: $owner) {
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
export const onDeleteGoal = /* GraphQL */ `
  subscription OnDeleteGoal($owner: String) {
    onDeleteGoal(owner: $owner) {
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
export const onCreateGoalExercise = /* GraphQL */ `
  subscription OnCreateGoalExercise($owner: String) {
    onCreateGoalExercise(owner: $owner) {
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
export const onUpdateGoalExercise = /* GraphQL */ `
  subscription OnUpdateGoalExercise($owner: String) {
    onUpdateGoalExercise(owner: $owner) {
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
export const onDeleteGoalExercise = /* GraphQL */ `
  subscription OnDeleteGoalExercise($owner: String) {
    onDeleteGoalExercise(owner: $owner) {
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
export const onCreateStepData = /* GraphQL */ `
  subscription OnCreateStepData($owner: String) {
    onCreateStepData(owner: $owner) {
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
export const onUpdateStepData = /* GraphQL */ `
  subscription OnUpdateStepData($owner: String) {
    onUpdateStepData(owner: $owner) {
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
export const onDeleteStepData = /* GraphQL */ `
  subscription OnDeleteStepData($owner: String) {
    onDeleteStepData(owner: $owner) {
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
export const onCreateStrengthData = /* GraphQL */ `
  subscription OnCreateStrengthData($owner: String) {
    onCreateStrengthData(owner: $owner) {
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
export const onUpdateStrengthData = /* GraphQL */ `
  subscription OnUpdateStrengthData($owner: String) {
    onUpdateStrengthData(owner: $owner) {
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
export const onDeleteStrengthData = /* GraphQL */ `
  subscription OnDeleteStrengthData($owner: String) {
    onDeleteStrengthData(owner: $owner) {
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
export const onCreateEnduranceData = /* GraphQL */ `
  subscription OnCreateEnduranceData($owner: String) {
    onCreateEnduranceData(owner: $owner) {
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
export const onUpdateEnduranceData = /* GraphQL */ `
  subscription OnUpdateEnduranceData($owner: String) {
    onUpdateEnduranceData(owner: $owner) {
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
export const onDeleteEnduranceData = /* GraphQL */ `
  subscription OnDeleteEnduranceData($owner: String) {
    onDeleteEnduranceData(owner: $owner) {
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
export const onCreateWeightData = /* GraphQL */ `
  subscription OnCreateWeightData($owner: String) {
    onCreateWeightData(owner: $owner) {
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
export const onUpdateWeightData = /* GraphQL */ `
  subscription OnUpdateWeightData($owner: String) {
    onUpdateWeightData(owner: $owner) {
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
export const onDeleteWeightData = /* GraphQL */ `
  subscription OnDeleteWeightData($owner: String) {
    onDeleteWeightData(owner: $owner) {
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
export const onCreateNewSkillTypeData = /* GraphQL */ `
  subscription OnCreateNewSkillTypeData($owner: String) {
    onCreateNewSkillTypeData(owner: $owner) {
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
export const onUpdateNewSkillTypeData = /* GraphQL */ `
  subscription OnUpdateNewSkillTypeData($owner: String) {
    onUpdateNewSkillTypeData(owner: $owner) {
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
export const onDeleteNewSkillTypeData = /* GraphQL */ `
  subscription OnDeleteNewSkillTypeData($owner: String) {
    onDeleteNewSkillTypeData(owner: $owner) {
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
export const onCreateHabitTypeData = /* GraphQL */ `
  subscription OnCreateHabitTypeData($owner: String) {
    onCreateHabitTypeData(owner: $owner) {
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
export const onUpdateHabitTypeData = /* GraphQL */ `
  subscription OnUpdateHabitTypeData($owner: String) {
    onUpdateHabitTypeData(owner: $owner) {
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
export const onDeleteHabitTypeData = /* GraphQL */ `
  subscription OnDeleteHabitTypeData($owner: String) {
    onDeleteHabitTypeData(owner: $owner) {
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
export const onCreateLimitTypeData = /* GraphQL */ `
  subscription OnCreateLimitTypeData($owner: String) {
    onCreateLimitTypeData(owner: $owner) {
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
export const onUpdateLimitTypeData = /* GraphQL */ `
  subscription OnUpdateLimitTypeData($owner: String) {
    onUpdateLimitTypeData(owner: $owner) {
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
export const onDeleteLimitTypeData = /* GraphQL */ `
  subscription OnDeleteLimitTypeData($owner: String) {
    onDeleteLimitTypeData(owner: $owner) {
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
export const onCreateMeditationData = /* GraphQL */ `
  subscription OnCreateMeditationData($owner: String) {
    onCreateMeditationData(owner: $owner) {
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
export const onUpdateMeditationData = /* GraphQL */ `
  subscription OnUpdateMeditationData($owner: String) {
    onUpdateMeditationData(owner: $owner) {
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
export const onDeleteMeditationData = /* GraphQL */ `
  subscription OnDeleteMeditationData($owner: String) {
    onDeleteMeditationData(owner: $owner) {
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
export const onCreateLevel = /* GraphQL */ `
  subscription OnCreateLevel($owner: String) {
    onCreateLevel(owner: $owner) {
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
export const onUpdateLevel = /* GraphQL */ `
  subscription OnUpdateLevel($owner: String) {
    onUpdateLevel(owner: $owner) {
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
export const onDeleteLevel = /* GraphQL */ `
  subscription OnDeleteLevel($owner: String) {
    onDeleteLevel(owner: $owner) {
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
export const onCreatePoint = /* GraphQL */ `
  subscription OnCreatePoint($owner: String) {
    onCreatePoint(owner: $owner) {
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
export const onUpdatePoint = /* GraphQL */ `
  subscription OnUpdatePoint($owner: String) {
    onUpdatePoint(owner: $owner) {
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
export const onDeletePoint = /* GraphQL */ `
  subscription OnDeletePoint($owner: String) {
    onDeletePoint(owner: $owner) {
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
export const onCreateUserStat = /* GraphQL */ `
  subscription OnCreateUserStat($owner: String) {
    onCreateUserStat(owner: $owner) {
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
export const onUpdateUserStat = /* GraphQL */ `
  subscription OnUpdateUserStat($owner: String) {
    onUpdateUserStat(owner: $owner) {
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
export const onDeleteUserStat = /* GraphQL */ `
  subscription OnDeleteUserStat($owner: String) {
    onDeleteUserStat(owner: $owner) {
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
export const onCreateUserExerciseStat = /* GraphQL */ `
  subscription OnCreateUserExerciseStat($owner: String) {
    onCreateUserExerciseStat(owner: $owner) {
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
export const onUpdateUserExerciseStat = /* GraphQL */ `
  subscription OnUpdateUserExerciseStat($owner: String) {
    onUpdateUserExerciseStat(owner: $owner) {
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
export const onDeleteUserExerciseStat = /* GraphQL */ `
  subscription OnDeleteUserExerciseStat($owner: String) {
    onDeleteUserExerciseStat(owner: $owner) {
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
export const onCreateDailyToDo = /* GraphQL */ `
  subscription OnCreateDailyToDo($owner: String) {
    onCreateDailyToDo(owner: $owner) {
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
export const onUpdateDailyToDo = /* GraphQL */ `
  subscription OnUpdateDailyToDo($owner: String) {
    onUpdateDailyToDo(owner: $owner) {
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
export const onDeleteDailyToDo = /* GraphQL */ `
  subscription OnDeleteDailyToDo($owner: String) {
    onDeleteDailyToDo(owner: $owner) {
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
export const onCreateScheduleToDo = /* GraphQL */ `
  subscription OnCreateScheduleToDo($owner: String) {
    onCreateScheduleToDo(owner: $owner) {
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
export const onUpdateScheduleToDo = /* GraphQL */ `
  subscription OnUpdateScheduleToDo($owner: String) {
    onUpdateScheduleToDo(owner: $owner) {
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
export const onDeleteScheduleToDo = /* GraphQL */ `
  subscription OnDeleteScheduleToDo($owner: String) {
    onDeleteScheduleToDo(owner: $owner) {
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
export const onCreateMasterToDo = /* GraphQL */ `
  subscription OnCreateMasterToDo($owner: String) {
    onCreateMasterToDo(owner: $owner) {
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
export const onUpdateMasterToDo = /* GraphQL */ `
  subscription OnUpdateMasterToDo($owner: String) {
    onUpdateMasterToDo(owner: $owner) {
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
export const onDeleteMasterToDo = /* GraphQL */ `
  subscription OnDeleteMasterToDo($owner: String) {
    onDeleteMasterToDo(owner: $owner) {
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
export const onCreateWeeklyToDo = /* GraphQL */ `
  subscription OnCreateWeeklyToDo($owner: String) {
    onCreateWeeklyToDo(owner: $owner) {
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
export const onUpdateWeeklyToDo = /* GraphQL */ `
  subscription OnUpdateWeeklyToDo($owner: String) {
    onUpdateWeeklyToDo(owner: $owner) {
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
export const onDeleteWeeklyToDo = /* GraphQL */ `
  subscription OnDeleteWeeklyToDo($owner: String) {
    onDeleteWeeklyToDo(owner: $owner) {
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
export const onCreateGroceryToDo = /* GraphQL */ `
  subscription OnCreateGroceryToDo($owner: String) {
    onCreateGroceryToDo(owner: $owner) {
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
export const onUpdateGroceryToDo = /* GraphQL */ `
  subscription OnUpdateGroceryToDo($owner: String) {
    onUpdateGroceryToDo(owner: $owner) {
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
export const onDeleteGroceryToDo = /* GraphQL */ `
  subscription OnDeleteGroceryToDo($owner: String) {
    onDeleteGroceryToDo(owner: $owner) {
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
export const onCreateSchedule = /* GraphQL */ `
  subscription OnCreateSchedule($owner: String) {
    onCreateSchedule(owner: $owner) {
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
export const onUpdateSchedule = /* GraphQL */ `
  subscription OnUpdateSchedule($owner: String) {
    onUpdateSchedule(owner: $owner) {
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
export const onDeleteSchedule = /* GraphQL */ `
  subscription OnDeleteSchedule($owner: String) {
    onDeleteSchedule(owner: $owner) {
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
export const onCreateStreak = /* GraphQL */ `
  subscription OnCreateStreak($trainerId: String) {
    onCreateStreak(trainerId: $trainerId) {
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
export const onUpdateStreak = /* GraphQL */ `
  subscription OnUpdateStreak($trainerId: String) {
    onUpdateStreak(trainerId: $trainerId) {
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
export const onDeleteStreak = /* GraphQL */ `
  subscription OnDeleteStreak($trainerId: String) {
    onDeleteStreak(trainerId: $trainerId) {
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
export const onCreateRoutineData = /* GraphQL */ `
  subscription OnCreateRoutineData($owner: String) {
    onCreateRoutineData(owner: $owner) {
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
export const onUpdateRoutineData = /* GraphQL */ `
  subscription OnUpdateRoutineData($owner: String) {
    onUpdateRoutineData(owner: $owner) {
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
export const onDeleteRoutineData = /* GraphQL */ `
  subscription OnDeleteRoutineData($owner: String) {
    onDeleteRoutineData(owner: $owner) {
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
export const onCreateUserActivateType = /* GraphQL */ `
  subscription OnCreateUserActivateType($owner: String) {
    onCreateUserActivateType(owner: $owner) {
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
export const onUpdateUserActivateType = /* GraphQL */ `
  subscription OnUpdateUserActivateType($owner: String) {
    onUpdateUserActivateType(owner: $owner) {
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
export const onDeleteUserActivateType = /* GraphQL */ `
  subscription OnDeleteUserActivateType($owner: String) {
    onDeleteUserActivateType(owner: $owner) {
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
export const onCreateUserProfile = /* GraphQL */ `
  subscription OnCreateUserProfile($owner: String) {
    onCreateUserProfile(owner: $owner) {
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
export const onUpdateUserProfile = /* GraphQL */ `
  subscription OnUpdateUserProfile($owner: String) {
    onUpdateUserProfile(owner: $owner) {
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
export const onDeleteUserProfile = /* GraphQL */ `
  subscription OnDeleteUserProfile($owner: String) {
    onDeleteUserProfile(owner: $owner) {
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
export const onCreateIntegration = /* GraphQL */ `
  subscription OnCreateIntegration($owner: String) {
    onCreateIntegration(owner: $owner) {
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
export const onUpdateIntegration = /* GraphQL */ `
  subscription OnUpdateIntegration($owner: String) {
    onUpdateIntegration(owner: $owner) {
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
export const onDeleteIntegration = /* GraphQL */ `
  subscription OnDeleteIntegration($owner: String) {
    onDeleteIntegration(owner: $owner) {
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
export const onCreatePostTag = /* GraphQL */ `
  subscription OnCreatePostTag {
    onCreatePostTag {
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
export const onUpdatePostTag = /* GraphQL */ `
  subscription OnUpdatePostTag {
    onUpdatePostTag {
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
export const onDeletePostTag = /* GraphQL */ `
  subscription OnDeletePostTag {
    onDeletePostTag {
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
