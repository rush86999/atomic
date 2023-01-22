import { gql } from "@apollo/client";


export default gql`
subscription ActiveSubscription($userId: uuid!, $updatedAt: timestamptz!) {
  Active_Subscription(where: {userId: {_eq: $userId}, updatedAt: {_gt: $updatedAt}}, order_by: {updatedAt: desc}, limit: 1) {
    createdDate
    deleted
    endDate
    id
    startDate
    status
    subscriptionId
    transactionId
    updatedAt
  }
}
`