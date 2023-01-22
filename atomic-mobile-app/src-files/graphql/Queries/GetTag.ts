
export default `
query GetTag($id: ID!) {
  getTag(id: $id) {
    id
    name
    posts {
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
    createdAt
    updatedAt
    _version
    _deleted
    _lastChangedAt
  }
}
`
