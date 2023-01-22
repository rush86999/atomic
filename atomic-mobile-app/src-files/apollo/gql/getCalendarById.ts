import { gql } from '@apollo/client';

export default gql`
query GetCalendarById($id: String!) {
  Calendar_by_pk(id: $id) {
    id
    title
    colorId
    account
    accessLevel
    modifiable
    resource
    defaultReminders
    globalPrimary
    deleted
    createdDate
    updatedAt
    userId
    foregroundColor
    backgroundColor
    pageToken
    syncToken
  }
}
`