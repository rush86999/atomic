
export default `
  query GetFollower($userId: ID!, $followerProfileId: ID!) {
    getFollower(userId: $userId, followerProfileId: $followerProfileId) {
      id
      userId
      followerProfileId
      avatar
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
