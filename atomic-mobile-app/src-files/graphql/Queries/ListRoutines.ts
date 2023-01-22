
export default `
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
`
