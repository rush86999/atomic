
export default `
  query ListUsersBySub(
    $sub: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsersBySub(
      sub: $sub
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        profileId
        sub
        email
        phoneNumber
        name
        customerId
        timezone
        onboard
        paymentCards {
          cardId
          cardBrand
          bin
          preferred
        }
        pushToken
        _version
        _deleted
        _lastChangedAt
        createdAt
        updatedAt
        owner
      }
      nextToken
      startedAt
    }
  }
`
