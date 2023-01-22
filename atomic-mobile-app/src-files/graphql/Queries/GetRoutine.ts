
export default `
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
`
