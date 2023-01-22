
export default `
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
`
