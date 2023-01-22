import { gql } from "@apollo/client";


export default gql`
query ListSubscriptionsForIos {
  Subscription(where: {device: {_eq: "ios"}}) {
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
    introductoryPriceSubscriptionPeriod
    localizedPrice
    paymentMode
    price
    subscriptionPeriodNumber
    subscriptionPeriodUnit
    title
    updatedAt
  }
}
`