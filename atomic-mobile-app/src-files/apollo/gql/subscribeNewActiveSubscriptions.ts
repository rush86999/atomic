import { gql } from "@apollo/client";


export default gql`
subscription ActiveSubscription($userId: uuid!, $createdDate: timestamptz!) {
  Active_Subscription(where: {userId: {_eq: $userId}, createdDate: {_gt: $createdDate}}) {
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