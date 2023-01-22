import { gql } from "@apollo/client";

export default gql`
    mutation InsertTransaction($transactions: [Transaction_insert_input!]!) {
              insert_Transaction(
                  objects: $transactions,
                  on_conflict: {
                      constraint: Transaction_pkey,
                      update_columns: [
                            subscriptionId,
                            quantity,
                            subscriptionDate,
                            originalTransactionDate,
                            originalTransactionId,
                            autoRenewingAndroid,
                            dataAndroid,
                            signatureAndroid,
                            activeSubscriptionId,
                            receipt,
                            userId,
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