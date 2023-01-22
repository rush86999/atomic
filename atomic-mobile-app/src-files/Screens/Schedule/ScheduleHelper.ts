import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { getCalendarInDb } from "@screens/Calendar/UserCreateCalendarHelper";


export const getGlobalPrimaryCalendarFunction = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        return getCalendarInDb(client, userId, undefined, true);
    } catch (e) {

    }
}