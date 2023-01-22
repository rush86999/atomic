
export default `
query ListGroceryTodosByUser(
  $userId: ID!
  $id: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelGroceryToDoFilterInput
  $limit: Int
  $nextToken: String
) {
  listGroceryTodosByUser(
    userId: $userId
    id: $id
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      userId
      notes
      completed
      startDate
      endDate
      completedDate
      nextDay
      important
      date
      event
      scheduleId
      softDeadline
      hardDeadline
      recurring
      syncId
      syncName
      status
      parentId
      location
      tags
      heading
      order
      eventId
      duration
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
