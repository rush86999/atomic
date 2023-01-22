
export default `
  query ListUsersByFollowerProfileId(
    $followerProfileId: ID!
    $userId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsersByFollowerProfileId(
      followerProfileId: $followerProfileId
      userId: $userId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
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
      nextToken
      startedAt
    }
  }
`
