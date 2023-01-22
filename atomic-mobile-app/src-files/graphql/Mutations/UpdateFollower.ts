
export default `
  mutation UpdateFollower(
    $input: UpdateFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    updateFollower(input: $input, condition: $condition) {
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
