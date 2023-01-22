import { gql } from "@apollo/client";


export default gql`
    subscription AdminBetaTesting {
    Admin_Beta_Testing(limit: 1) {
        createdDate
        deleted
        enableTesting
        id
        updatedAt
    }
    }
`