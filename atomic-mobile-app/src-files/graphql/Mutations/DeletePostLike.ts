
export default `
  mutation DeletePostLike(
    $input: DeletePostLikeInput!
    $condition: ModelPostLikeConditionInput
  ) {
    deletePostLike(input: $input, condition: $condition) {
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
