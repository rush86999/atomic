
export default `
  query ListFollowingByUser(
    $userId: ID!
    $followingProfileId: ModelIDKeyConditionInput
    $sortDirection: ModelSortDirection
    $filter: ModelFollowingFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFollowingByUser(
      userId: $userId
      followingProfileId: $followingProfileId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        followingProfileId
        username
        avatar
        isFollowing
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
