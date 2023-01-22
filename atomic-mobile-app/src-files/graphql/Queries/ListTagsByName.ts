
export default `
  query ListTagsByName(
    $name: String!
    $sortDirection: ModelSortDirection
    $filter: ModelTagFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTagsByName(
      name: $name
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`
