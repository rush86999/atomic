
export default `
  mutation CreatePostLike(
    $input: CreatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    createPostLike(input: $input, condition: $condition) {
      id
      postId
      userId
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
