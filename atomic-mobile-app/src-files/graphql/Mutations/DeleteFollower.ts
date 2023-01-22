
export default `
  mutation DeleteFollower(
    $input: DeleteFollowerInput!
    $condition: ModelFollowerConditionInput
  ) {
    deleteFollower(input: $input, condition: $condition) {
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
