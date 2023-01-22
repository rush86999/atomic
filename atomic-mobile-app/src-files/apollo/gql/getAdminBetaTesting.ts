import { gql } from "@apollo/client";


export default gql`
    query GetAdminBetaTesting {
        Admin_Beta_Testing {
            deleted
            enableTesting
            id
            createdDate
            updatedAt
        }
    }
`