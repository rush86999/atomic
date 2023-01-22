
export default `
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`
