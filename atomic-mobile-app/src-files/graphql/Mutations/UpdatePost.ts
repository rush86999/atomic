
export default `
mutation UpdatePost(
  $input: UpdatePostInput!
  $condition: ModelPostConditionInput
) {
  updatePost(input: $input, condition: $condition) {
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
        tag {
          id
          name
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
        post {
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
          createdAt
          updatedAt
          _version
          _deleted
          _lastChangedAt
        }
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
}
`