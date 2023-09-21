import { gql } from "@apollo/client";


export default gql`
mutation DeleteCalendarById($id: String!) {
  delete_Calendar_by_pk(id: $id) {
    accessLevel
    account
    backgroundColor
    colorId
    createdDate
    defaultReminders
    deleted
    foregroundColor
    globalPrimary
    id
    modifiable
    resource
    title
    updatedAt
    userId
  }
}
`