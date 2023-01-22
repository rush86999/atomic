
export default `
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
`
