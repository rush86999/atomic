import { gql } from "@apollo/client";


export default gql`
mutation UpdateActiveSubscriptionStatusToTrue($id: uuid!) {
  update_Active_Subscription_by_pk(pk_columns: {id: $id}, _set: {status: true}) {
    createdDate
    deleted
    endDate
    id
    startDate
    status
    subscriptionId
    transactionId
    updatedAt
    userId
  }
}
`