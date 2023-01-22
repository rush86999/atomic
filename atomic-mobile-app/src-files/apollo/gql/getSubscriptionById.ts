import { gql } from "@apollo/client";

export default gql`
query GetSubscription($id: String!) {
  Subscription_by_pk(id: $id) {
    createdDate
    currency
    deleted
    description
    device
    id
    introductoryPrice
    introductoryPriceAsAmount
    introductoryPriceNumberOfPeriods
    introductoryPricePaymentMode
    localizedPrice
    introductoryPriceSubscriptionPeriod
    paymentMode
    price
    subscriptionPeriodNumber
    subscriptionPeriodUnit
    title
    updatedAt
  }
}
`