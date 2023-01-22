
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
  split, HttpLink, from
} from "@apollo/client"
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { onError } from "@apollo/client/link/error"
import { hasuraWSUrl, hasuraDbUrl } from '@app/lib/constants'
import { Auth } from 'aws-amplify';

const makeApolloClient = (token: String) => {

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        switch (err.extensions.code) {
          case 'UNAUTHENTICATED':

            const oldHeaders = operation.getContext().headers;
            operation.setContext(async (_: any, { headers }: any) => {
              const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()
              return {
                headers: {
                  ...headers,
                  Authorization: accessToken ? `Bearer ${accessToken}` : ''
                }
              }
            })
            return forward(operation);
        }
      }
    }

    if (networkError) {

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
    const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()
    return {
      headers: {
        ...headers,
        Authorization: accessToken ? `Bearer ${accessToken}` : ''
      }
    }
  })

  const httpLink = new HttpLink({
    uri: hasuraDbUrl,
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
  const cache = new InMemoryCache()

  const client = new ApolloClient({
    link: splitLink,
    cache
  });

  return client;
}

export default makeApolloClient;
