
export default `
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
`
