
export default `
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
`
