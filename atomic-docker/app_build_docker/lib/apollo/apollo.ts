
// import { HttpLink } from 'apollo-link-http'
// import { ApolloClient } from 'apollo-client'
// import { InMemoryCache } from 'apollo-cache-inmemory'
import {
  ApolloClient,
  InMemoryCache,
  split, HttpLink, from
} from "@apollo/client"
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { onError } from "@apollo/client/link/error"

import { hasuraWSUrl, hasuraDbUrl } from '@lib/constants'
import Session from "supertokens-web-js/recipe/session";
//endpointURL

const makeApolloClient = (token: String) => {
  if (!token) return
  
  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        switch (err.extensions.code) {
          // Apollo Server sets code to UNAUTHENTICATED
          // when an AuthenticationError is thrown in a resolver
          case 'UNAUTHENTICATED':

            // Modify the operation context with a new token
            const oldHeaders = operation.getContext().headers;
            operation.setContext(async (_: any, { headers }: any) => {
              const accessToken = await Session.getAccessToken();
              return {
                headers: {
                  ...headers,
                  Authorization: accessToken ? `Bearer ${accessToken}` : ''
                }
              }
            })
            // Retry the request, returning the new observable
            return forward(operation);
        }
      }
    }

    // To retry on network errors, we recommend the RetryLink
    // instead of the onError link. This just logs the error.
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  });

  const wsLink = new GraphQLWsLink(createClient({
    url: hasuraWSUrl,
    connectionParams: {
      Authorization: `Bearer ${token}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
  }))

  const linkTokenHeader = setContext(async (_, { headers }) => {
    const accessToken = await Session.getAccessToken();
    return {
      headers: {
        ...headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : ''
      }
    }
  })

  const httpLink = new HttpLink({
    uri: hasuraDbUrl,
    // headers: {
    //   Authorization: `Bearer ${}`
    // },
  })

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    from([errorLink, linkTokenHeader, httpLink]),
  )
  // create an inmemory cache instance for caching graphql data
  const cache = new InMemoryCache()

  // instantiate apollo client with apollo link instance and cache instance
  const client = new ApolloClient({
    link: splitLink,
    cache
  });

  return client;
}

export default makeApolloClient;
