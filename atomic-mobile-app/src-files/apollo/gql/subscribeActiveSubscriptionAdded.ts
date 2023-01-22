import { gql } from "@apollo/client";


export default gql`
    subscription OnActiveSubscriptionAdded($userId: uuid!, $createdDate: timestamptz!) {
        Active_Subscription(where: {userId: {_eq: $userId}, createdDate: {_gt: $createdDate}}, order_by: {createdDate: desc}, limit: 1) {
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