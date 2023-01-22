
export default `
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      routines {
        items {
          id
          routineId
          exerciseId
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
          routine {
            id
            name
            nId
            description
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          exercise {
            id
            name
            nId
            type
            description
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
        }
        nextToken
      }
    }
  }
`
