
export default `
  query ListFollowers(
    $userId: ID
    $followerProfileId: ModelIDKeyConditionInput
    $filter: ModelFollowerFilterInput
    $limit: Int
    $nextToken: String
    $sortDirection: ModelSortDirection
  ) {
    listFollowers(
      userId: $userId
      followerProfileId: $followerProfileId
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      sortDirection: $sortDirection
    ) {
      items {
        id
        userId
        followerProfileId
        avatar
        username
        isFollower
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
