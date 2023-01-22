
export default `
query ListPostsByUserId(
  $userId: ID!
  $date: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelPostFilterInput
  $limit: Int
  $nextToken: String
) {
  listPostsByUserId(
    userId: $userId
    date: $date
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      dateDay
      date
      postUlid
      caption
      tags {
        items {
          id
          tagID
          postID
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        nextToken
        startedAt
      }
      image
      userId
      likes {
        items {
          id
          postId
          userId
          isLike
          username
          ttl
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
          owner
        }
        nextToken
        startedAt
      }
      likeCount
      commentCount
      avatar
      username
      profileId
      ttl
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
    }
    nextToken
    startedAt
  }
}
`
