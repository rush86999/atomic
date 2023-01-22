import { gql } from "@apollo/client";

export default gql`
mutation InsertActive_Subscription($active_subscriptions: [Active_Subscription_insert_input!]!) {
              insert_Active_Subscription(
                  objects: $active_subscriptions,
                  on_conflict: {
                      constraint: Active_Subscription_pkey,
                      update_columns: [
                            userId,
                            subscriptionId,
                            transactionId,
                            startDate,
                            endDate,
                            status,
                            deleted, 
                            updatedAt,
                        ]
                  }){
                  returning {
                    id
                  }
                }
         }
`