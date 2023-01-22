
export default `
query ListPostLikesByPost(
  $postId: ID!
  $id: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelPostLikeFilterInput
  $limit: Int
  $nextToken: String
) {
  listPostLikesByPost(
    postId: $postId
    id: $id
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
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
}
`
