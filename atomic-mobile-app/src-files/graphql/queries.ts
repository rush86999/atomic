/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getActivity = /* GraphQL */ `
  query GetActivity($id: ID!) {
    getActivity(id: $id) {
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
export const listActivities = /* GraphQL */ `
  query ListActivities(
    $filter: ModelActivityFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActivities(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncActivities = /* GraphQL */ `
  query SyncActivities(
    $filter: ModelActivityFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncActivities(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listActivitiesByUser = /* GraphQL */ `
  query ListActivitiesByUser(
    $userId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelActivityFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActivitiesByUser(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getFollower = /* GraphQL */ `
  query GetFollower($userId: ID!, $followerProfileId: ID!) {
    getFollower(userId: $userId, followerProfileId: $followerProfileId) {
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
export const listFollowers = /* GraphQL */ `
  query ListFollowers(
    $userId: ID
    $followerProfileId: ModelIDKeyConditionInput
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listFollowers(
      userId: $userId
      followerProfileId: $followerProfileId
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncFollowers = /* GraphQL */ `
  query SyncFollowers(
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFollowers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUsersByFollowerProfileId = /* GraphQL */ `
  query ListUsersByFollowerProfileId(
    $followerProfileId: ID!
    $userId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsersByFollowerProfileId(
      followerProfileId: $followerProfileId
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getFollowing = /* GraphQL */ `
  query GetFollowing($id: ID!) {
    getFollowing(id: $id) {
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
export const listFollowings = /* GraphQL */ `
  query ListFollowings(
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFollowings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncFollowings = /* GraphQL */ `
  query SyncFollowings(
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncFollowings(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listFollowingByUser = /* GraphQL */ `
  query ListFollowingByUser(
    $userId: ID!
    $followingProfileId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFollowingByUser(
      userId: $userId
      followingProfileId: $followingProfileId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUsersByFollowingProfileId = /* GraphQL */ `
  query ListUsersByFollowingProfileId(
    $followingProfileId: ID!
    $userId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsersByFollowingProfileId(
      followingProfileId: $followingProfileId
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
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
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncUsers = /* GraphQL */ `
  query SyncUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUsers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUsersBySub = /* GraphQL */ `
  query ListUsersBySub(
    $sub: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsersBySub(
      sub: $sub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getGoal = /* GraphQL */ `
  query GetGoal($id: ID!) {
    getGoal(id: $id) {
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
export const listGoals = /* GraphQL */ `
  query ListGoals(
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoals(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncGoals = /* GraphQL */ `
  query SyncGoals(
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGoals(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUserGoalsByDate = /* GraphQL */ `
  query ListUserGoalsByDate(
    $userId: ID!
    $dateStatusPrimaryGoalType: ModelGoalByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGoalFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserGoalsByDate(
      userId: $userId
      dateStatusPrimaryGoalType: $dateStatusPrimaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getGoalExercise = /* GraphQL */ `
  query GetGoalExercise($id: ID!) {
    getGoalExercise(id: $id) {
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
export const listGoalExercises = /* GraphQL */ `
  query ListGoalExercises(
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoalExercises(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncGoalExercises = /* GraphQL */ `
  query SyncGoalExercises(
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGoalExercises(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUserGoalExercisesByDate = /* GraphQL */ `
  query ListUserGoalExercisesByDate(
    $userId: ID!
    $dateStatusPrimaryGoalTypeSecondaryGoalType: ModelGoalExerciseByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGoalExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserGoalExercisesByDate(
      userId: $userId
      dateStatusPrimaryGoalTypeSecondaryGoalType: $dateStatusPrimaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getStepData = /* GraphQL */ `
  query GetStepData($id: ID!) {
    getStepData(id: $id) {
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
export const listStepData = /* GraphQL */ `
  query ListStepData(
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStepData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncStepData = /* GraphQL */ `
  query SyncStepData(
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStepData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const stepsDataByUserByDate = /* GraphQL */ `
  query StepsDataByUserByDate(
    $userId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStepDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    stepsDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getStrengthData = /* GraphQL */ `
  query GetStrengthData($id: ID!) {
    getStrengthData(id: $id) {
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
export const listStrengthData = /* GraphQL */ `
  query ListStrengthData(
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStrengthData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncStrengthData = /* GraphQL */ `
  query SyncStrengthData(
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStrengthData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const strengthDataByUserByTypeAndDate = /* GraphQL */ `
  query StrengthDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStrengthDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    strengthDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getEnduranceData = /* GraphQL */ `
  query GetEnduranceData($id: ID!) {
    getEnduranceData(id: $id) {
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
export const listEnduranceData = /* GraphQL */ `
  query ListEnduranceData(
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listEnduranceData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncEnduranceData = /* GraphQL */ `
  query SyncEnduranceData(
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncEnduranceData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const exerciseDataByUserByTypeAndDate = /* GraphQL */ `
  query ExerciseDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelEnduranceDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    exerciseDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getWeightData = /* GraphQL */ `
  query GetWeightData($id: ID!) {
    getWeightData(id: $id) {
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
export const listWeightData = /* GraphQL */ `
  query ListWeightData(
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeightData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncWeightData = /* GraphQL */ `
  query SyncWeightData(
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWeightData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const weightDataByUserByDate = /* GraphQL */ `
  query WeightDataByUserByDate(
    $userId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWeightDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    weightDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getNewSkillTypeData = /* GraphQL */ `
  query GetNewSkillTypeData($id: ID!) {
    getNewSkillTypeData(id: $id) {
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
export const listNewSkillTypeData = /* GraphQL */ `
  query ListNewSkillTypeData(
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listNewSkillTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncNewSkillTypeData = /* GraphQL */ `
  query SyncNewSkillTypeData(
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncNewSkillTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const newSkillDataByUserByTypeAndDate = /* GraphQL */ `
  query NewSkillDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelNewSkillTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    newSkillDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getHabitTypeData = /* GraphQL */ `
  query GetHabitTypeData($id: ID!) {
    getHabitTypeData(id: $id) {
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
export const listHabitTypeData = /* GraphQL */ `
  query ListHabitTypeData(
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listHabitTypeData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncHabitTypeData = /* GraphQL */ `
  query SyncHabitTypeData(
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncHabitTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const habitDataByUserByTypeAndDate = /* GraphQL */ `
  query HabitDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelHabitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    habitDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getLimitTypeData = /* GraphQL */ `
  query GetLimitTypeData($id: ID!) {
    getLimitTypeData(id: $id) {
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
export const listLimitTypeData = /* GraphQL */ `
  query ListLimitTypeData(
    $filter: ModelLimitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLimitTypeData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncLimitTypeData = /* GraphQL */ `
  query SyncLimitTypeData(
    $filter: ModelLimitTypeDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncLimitTypeData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const limitDataByUserByTypeAndDate = /* GraphQL */ `
  query LimitDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLimitTypeDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    limitDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getMeditationData = /* GraphQL */ `
  query GetMeditationData($id: ID!) {
    getMeditationData(id: $id) {
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
export const listMeditationData = /* GraphQL */ `
  query ListMeditationData(
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMeditationData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncMeditationData = /* GraphQL */ `
  query SyncMeditationData(
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMeditationData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const meditationDataByUserByDate = /* GraphQL */ `
  query MeditationDataByUserByDate(
    $userId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMeditationDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    meditationDataByUserByDate(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getLevel = /* GraphQL */ `
  query GetLevel($id: ID!) {
    getLevel(id: $id) {
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
export const listLevels = /* GraphQL */ `
  query ListLevels(
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLevels(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncLevels = /* GraphQL */ `
  query SyncLevels(
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncLevels(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listGoalTypesByUser = /* GraphQL */ `
  query ListGoalTypesByUser(
    $userId: ID!
    $primaryGoalTypeSecondaryGoalTypeDate: ModelLevelByUserByGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelLevelFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGoalTypesByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalTypeDate: $primaryGoalTypeSecondaryGoalTypeDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getPoint = /* GraphQL */ `
  query GetPoint($id: ID!) {
    getPoint(id: $id) {
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
export const listPoints = /* GraphQL */ `
  query ListPoints(
    $filter: ModelPointFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPoints(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncPoints = /* GraphQL */ `
  query SyncPoints(
    $filter: ModelPointFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPoints(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getUserStat = /* GraphQL */ `
  query GetUserStat($id: ID!) {
    getUserStat(id: $id) {
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
export const listUserStats = /* GraphQL */ `
  query ListUserStats(
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserStats(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncUserStats = /* GraphQL */ `
  query SyncUserStats(
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listStatsByUser = /* GraphQL */ `
  query ListStatsByUser(
    $userId: ID!
    $primaryGoalType: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStatsByUser(
      userId: $userId
      primaryGoalType: $primaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getRoutine = /* GraphQL */ `
  query GetRoutine($id: ID!) {
    getRoutine(id: $id) {
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
export const listRoutines = /* GraphQL */ `
  query ListRoutines(
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoutines(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncRoutines = /* GraphQL */ `
  query SyncRoutines(
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRoutines(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listRoutinesByName = /* GraphQL */ `
  query ListRoutinesByName(
    $nId: ID!
    $name: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRoutineFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoutinesByName(
      nId: $nId
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getExercise = /* GraphQL */ `
  query GetExercise($id: ID!) {
    getExercise(id: $id) {
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
export const listExercises = /* GraphQL */ `
  query ListExercises(
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExercises(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncExercises = /* GraphQL */ `
  query SyncExercises(
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncExercises(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listExerciseByName = /* GraphQL */ `
  query ListExerciseByName(
    $nId: ID!
    $name: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelExerciseFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExerciseByName(
      nId: $nId
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getUserExerciseStat = /* GraphQL */ `
  query GetUserExerciseStat($id: ID!) {
    getUserExerciseStat(id: $id) {
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
export const listUserExerciseStats = /* GraphQL */ `
  query ListUserExerciseStats(
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserExerciseStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncUserExerciseStats = /* GraphQL */ `
  query SyncUserExerciseStats(
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserExerciseStats(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listExerciseStatsByUser = /* GraphQL */ `
  query ListExerciseStatsByUser(
    $userId: ID!
    $primaryGoalTypeSecondaryGoalType: ModelUserExerciseStatByUserByPrimaryGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserExerciseStatFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listExerciseStatsByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalType: $primaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getDailyToDo = /* GraphQL */ `
  query GetDailyToDo($id: ID!) {
    getDailyToDo(id: $id) {
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
export const listDailyToDos = /* GraphQL */ `
  query ListDailyToDos(
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDailyToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncDailyToDos = /* GraphQL */ `
  query SyncDailyToDos(
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncDailyToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listDailyTodosByUser = /* GraphQL */ `
  query ListDailyTodosByUser(
    $userId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelDailyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listDailyTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getScheduleToDo = /* GraphQL */ `
  query GetScheduleToDo($id: ID!) {
    getScheduleToDo(id: $id) {
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
export const listScheduleToDos = /* GraphQL */ `
  query ListScheduleToDos(
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listScheduleToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncScheduleToDos = /* GraphQL */ `
  query SyncScheduleToDos(
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncScheduleToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listActiveToDoSchedulesByDate = /* GraphQL */ `
  query ListActiveToDoSchedulesByDate(
    $userId: ID!
    $dateStatus: ModelScheduleToDoByUserByDateCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelScheduleToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActiveToDoSchedulesByDate(
      userId: $userId
      dateStatus: $dateStatus
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getMasterToDo = /* GraphQL */ `
  query GetMasterToDo($id: ID!) {
    getMasterToDo(id: $id) {
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
export const listMasterToDos = /* GraphQL */ `
  query ListMasterToDos(
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMasterToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncMasterToDos = /* GraphQL */ `
  query SyncMasterToDos(
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncMasterToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listMasterTodosByUser = /* GraphQL */ `
  query ListMasterTodosByUser(
    $userId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelMasterToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listMasterTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getWeeklyToDo = /* GraphQL */ `
  query GetWeeklyToDo($id: ID!) {
    getWeeklyToDo(id: $id) {
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
export const listWeeklyToDos = /* GraphQL */ `
  query ListWeeklyToDos(
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeeklyToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncWeeklyToDos = /* GraphQL */ `
  query SyncWeeklyToDos(
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncWeeklyToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listWeeklyTodosByUser = /* GraphQL */ `
  query ListWeeklyTodosByUser(
    $userId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelWeeklyToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeeklyTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getGroceryToDo = /* GraphQL */ `
  query GetGroceryToDo($id: ID!) {
    getGroceryToDo(id: $id) {
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
export const listGroceryToDos = /* GraphQL */ `
  query ListGroceryToDos(
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroceryToDos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncGroceryToDos = /* GraphQL */ `
  query SyncGroceryToDos(
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncGroceryToDos(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listGroceryTodosByUser = /* GraphQL */ `
  query ListGroceryTodosByUser(
    $userId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelGroceryToDoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listGroceryTodosByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getSchedule = /* GraphQL */ `
  query GetSchedule($id: ID!) {
    getSchedule(id: $id) {
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
export const listSchedules = /* GraphQL */ `
  query ListSchedules(
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSchedules(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncSchedules = /* GraphQL */ `
  query SyncSchedules(
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSchedules(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listActiveSchedulesByDate = /* GraphQL */ `
  query ListActiveSchedulesByDate(
    $userIdGoal: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelScheduleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActiveSchedulesByDate(
      userIdGoal: $userIdGoal
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getStreak = /* GraphQL */ `
  query GetStreak($id: ID!) {
    getStreak(id: $id) {
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
export const listStreaks = /* GraphQL */ `
  query ListStreaks(
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStreaks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncStreaks = /* GraphQL */ `
  query SyncStreaks(
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncStreaks(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listStreaksByUserAndGoalType = /* GraphQL */ `
  query ListStreaksByUserAndGoalType(
    $userIdGoal: String!
    $startDate: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelStreakFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listStreaksByUserAndGoalType(
      userIdGoal: $userIdGoal
      startDate: $startDate
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getRoutineData = /* GraphQL */ `
  query GetRoutineData($id: ID!) {
    getRoutineData(id: $id) {
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
export const listRoutineData = /* GraphQL */ `
  query ListRoutineData(
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRoutineData(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncRoutineData = /* GraphQL */ `
  query SyncRoutineData(
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncRoutineData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const routineDataByUserByTypeAndDate = /* GraphQL */ `
  query RoutineDataByUserByTypeAndDate(
    $userIdType: String!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelRoutineDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    routineDataByUserByTypeAndDate(
      userIdType: $userIdType
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getUserActivateType = /* GraphQL */ `
  query GetUserActivateType($id: ID!) {
    getUserActivateType(id: $id) {
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
export const listUserActivateTypes = /* GraphQL */ `
  query ListUserActivateTypes(
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserActivateTypes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncUserActivateTypes = /* GraphQL */ `
  query SyncUserActivateTypes(
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserActivateTypes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listActivateTypesByUser = /* GraphQL */ `
  query ListActivateTypesByUser(
    $userId: ID!
    $primaryGoalTypeSecondaryGoalType: ModelUserActivateTypeByUserByGoalTypeCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelUserActivateTypeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listActivateTypesByUser(
      userId: $userId
      primaryGoalTypeSecondaryGoalType: $primaryGoalTypeSecondaryGoalType
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getTag = /* GraphQL */ `
  query GetTag($id: ID!) {
    getTag(id: $id) {
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
export const listTags = /* GraphQL */ `
  query ListTags(
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTags(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncTags = /* GraphQL */ `
  query SyncTags(
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncTags(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listTagsByName = /* GraphQL */ `
  query ListTagsByName(
    $name: String!
    $sortDirection: ModelSortDirection
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTagsByName(
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getPost = /* GraphQL */ `
  query GetPost($id: ID!) {
    getPost(id: $id) {
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
export const listPosts = /* GraphQL */ `
  query ListPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncPosts = /* GraphQL */ `
  query SyncPosts(
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPosts(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listPostsByDateDay = /* GraphQL */ `
  query ListPostsByDateDay(
    $dateDay: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostsByDateDay(
      dateDay: $dateDay
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listPostsByUserId = /* GraphQL */ `
  query ListPostsByUserId(
    $userId: ID!
    $date: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostsByUserId(
      userId: $userId
      date: $date
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getPostLike = /* GraphQL */ `
  query GetPostLike($id: ID!) {
    getPostLike(id: $id) {
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
export const listPostLikes = /* GraphQL */ `
  query ListPostLikes(
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostLikes(filter: $filter, limit: $limit, nextToken: $nextToken) {
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
  }
`;
export const syncPostLikes = /* GraphQL */ `
  query SyncPostLikes(
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPostLikes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
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
  }
`;
export const listPostLikesByPost = /* GraphQL */ `
  query ListPostLikesByPost(
    $postId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostLikesByPost(
      postId: $postId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
  }
`;
export const listPostLikesByUser = /* GraphQL */ `
  query ListPostLikesByUser(
    $userId: ID!
    $id: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelPostLikeFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostLikesByUser(
      userId: $userId
      id: $id
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
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
  }
`;
export const getUserProfile = /* GraphQL */ `
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
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
export const listUserProfiles = /* GraphQL */ `
  query ListUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfiles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncUserProfiles = /* GraphQL */ `
  query SyncUserProfiles(
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncUserProfiles(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUserProfilesByUserName = /* GraphQL */ `
  query ListUserProfilesByUserName(
    $username: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfilesByUserName(
      username: $username
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listUserProfilesBySub = /* GraphQL */ `
  query ListUserProfilesBySub(
    $sub: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfilesBySub(
      sub: $sub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getSavedPost = /* GraphQL */ `
  query GetSavedPost($id: ID!) {
    getSavedPost(id: $id) {
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
export const listSavedPosts = /* GraphQL */ `
  query ListSavedPosts(
    $filter: ModelSavedPostFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSavedPosts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
  }
`;
export const syncSavedPosts = /* GraphQL */ `
  query SyncSavedPosts(
    $filter: ModelSavedPostFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncSavedPosts(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
  }
`;
export const getComment = /* GraphQL */ `
  query GetComment($id: ID!) {
    getComment(id: $id) {
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
export const listComments = /* GraphQL */ `
  query ListComments(
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncComments = /* GraphQL */ `
  query SyncComments(
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncComments(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listCommentsByPost = /* GraphQL */ `
  query ListCommentsByPost(
    $postId: ID!
    $dateId: ModelCommentByPostCompositeKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelCommentFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listCommentsByPost(
      postId: $postId
      dateId: $dateId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getIntegration = /* GraphQL */ `
  query GetIntegration($id: ID!) {
    getIntegration(id: $id) {
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
export const listIntegrations = /* GraphQL */ `
  query ListIntegrations(
    $filter: ModelIntegrationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listIntegrations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const syncIntegrations = /* GraphQL */ `
  query SyncIntegrations(
    $filter: ModelIntegrationFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncIntegrations(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const listIntegrationsBySub = /* GraphQL */ `
  query ListIntegrationsBySub(
    $sub: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelIntegrationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listIntegrationsBySub(
      sub: $sub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`;
export const getPostTag = /* GraphQL */ `
  query GetPostTag($id: ID!) {
    getPostTag(id: $id) {
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
export const listPostTags = /* GraphQL */ `
  query ListPostTags(
    $filter: ModelPostTagFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPostTags(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        tagID
        postID
        tag {
          id
          name
          posts {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncPostTags = /* GraphQL */ `
  query SyncPostTags(
    $filter: ModelPostTagFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncPostTags(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        tagID
        postID
        tag {
          id
          name
          posts {
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
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
      }
      nextToken
      startedAt
    }
  }
`;
