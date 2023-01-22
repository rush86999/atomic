
export default `
  query GetComment($id: ID!) {
    getComment(id: $id) {
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
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`
