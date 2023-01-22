import { gql } from "@apollo/client";

export default gql`
query GetActiveSubscriptionByTransactionId($transactionId: String!) {
  Active_Subscription(where: {transactionId: {_eq: $transactionId}}) {
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