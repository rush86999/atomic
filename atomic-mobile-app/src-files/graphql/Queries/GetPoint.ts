
export default `
  query GetPoint($id: ID!) {
    getPoint(id: $id) {
      id
      points
      currentPoints
      max
      min
      maxDate
      minDate
      currentDate
      dayCount
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      owner
    }
  }
`
