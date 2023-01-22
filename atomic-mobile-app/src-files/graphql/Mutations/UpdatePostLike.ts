
export default `
  mutation UpdatePostLike(
    $input: UpdatePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    updatePostLike(input: $input, condition: $condition) {
      id
      postId
      userId
      isLike
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
