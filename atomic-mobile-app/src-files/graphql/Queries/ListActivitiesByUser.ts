
export default `
query ListActivitiesByUser(
  $userId: ID!
  $date: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelActivityFilterInput
  $limit: Int
  $nextToken: String
) {
  listActivitiesByUser(
    userId: $userId
    date: $date
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      date
      senderId
      activity
      objectId
      sendername
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
