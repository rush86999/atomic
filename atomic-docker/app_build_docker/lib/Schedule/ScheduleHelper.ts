import { ApolloClient, NormalizedCacheObject } from "@apollo/client"
import { getCalendarInDb } from "@lib/Calendar/UserCreateCalendarHelper"

export const getGlobalPrimaryCalendarFunction = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        // get global primary calendar
        return getCalendarInDb(client, userId, undefined, true);
    } catch (e) {
        console.log(e, ' getGlobalPrimaryCalendarFunction');
    }
}