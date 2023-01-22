
export default `
  mutation CreateFollower(
    $input: CreateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    createFollower(input: $input, condition: $condition) {
      id
      userId
      followerProfileId
      avatar
      username
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`
