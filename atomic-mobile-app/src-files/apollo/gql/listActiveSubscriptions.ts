import { gql } from "@apollo/client";


export default gql`
query ListActiveSubscriptions($userId: uuid!, $currentDate: timestamptz!) {
  Active_Subscription(where: {userId: {_eq: $userId}, status: {_eq: true}, endDate: {_gt: $currentDate}}) {
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