
export default `
  mutation CreateUserProfile(
    $input: CreateUserProfileInput!
    $condition: ModelUserProfileConditionInput
  ) {
    createUserProfile(input: $input, condition: $condition) {
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
          tags {
            nextToken
            startedAt
          }
          likes {
            nextToken
            startedAt
          }
        }
        nextToken
        startedAt
      }
      owner
    }
  }
`
