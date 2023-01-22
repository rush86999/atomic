import { ApolloClient, NormalizedCacheObject } from "@apollo/client"
import deleteConferencesByIds from "@app/apollo/gql/deleteConferencesByIds"


export const deleteConferencesWithIds = async (
  client: ApolloClient<NormalizedCacheObject>,
  ids: string[],
) => {
  try {
    const res = await client.mutate<{ delete_Conference: { affected_rows: number } }>({
      mutation: deleteConferencesByIds,
      variables: {
        ids,
      },
    })



  } catch (e) {

  }
}