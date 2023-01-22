export default `
  query ListUserProfilesByUserName(
    $username: String!
    $sortDirection: ModelSortDirection
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfilesByUserName(
      username: $username
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        avatar
        username
        email
        followerCount
        followingCount
        postCount
        bio
        userId
        sub
        pointId
        dietSettingsId
        mealPreferencesId
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        Posts {
          items {
            id
            dateDay
            date
            postUlid
            caption
            image
            userId
            likeCount
            commentCount
            avatar
            username
            profileId
            ttl
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
        }
        owner
      }
      nextToken
      startedAt
    }
  }
`
