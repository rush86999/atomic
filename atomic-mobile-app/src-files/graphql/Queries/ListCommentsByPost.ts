
export default `
query ListCommentsByPost(
  $postId: ID!
  $dateId: ModelCommentByPostCompositeKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelCommentFilterInput
  $limit: Int
  $nextToken: String
) {
  listCommentsByPost(
    postId: $postId
    dateId: $dateId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      postId
      date
      content
      userId
      username
      avatar
      profileId
      replyId
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
