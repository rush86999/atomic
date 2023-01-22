
export default `
  query ListUserProfilesBySub(
    $sub: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserProfileFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserProfilesBySub(
      sub: $sub
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
