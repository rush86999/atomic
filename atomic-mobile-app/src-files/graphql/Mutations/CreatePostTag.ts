
export default `
mutation CreatePostTag(
  $input: CreatePostTagInput!
  $condition: ModelPostTagConditionInput
) {
  createPostTag(input: $input, condition: $condition) {
    id
    tagID
    postID
    tag {
      id
      name
      posts {
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
  }
}
`