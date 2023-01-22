import { ApolloClient, NormalizedCacheObject } from "@apollo/client"
import deleteAutopilotsByUserId from "@app/apollo/gql/deleteAutopilotsByUserId"
import listAutopilotsGivenUserId from "@app/apollo/gql/listAutopilotsGivenUserId"
import upsertAutopilotMany from "@app/apollo/gql/upsertAutopilotMany"
import { AutopilotType, ScheduleAssistWithMeetingQueueBodyType } from "@dataTypes/AutopilotType"
import { addDailyFeaturesAutopilotProdUrl, deleteScheduledEventProdUrl, startDailyAssistAutopilotProdUrl } from "@screens/Settings/Autopilot/constants"
import { AddDailyFeaturesApplyEventTriggerType, StartDailyAssistEventTriggerType } from "@screens/Settings/Autopilot/types"
import { Auth } from "aws-amplify"
import axios from "axios"


export const deleteScheduledEvent = async (
    eventId: string,
) => {
    try {
        const url = deleteScheduledEventProdUrl
        const data = eventId

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const res = await axios.post(url, data, config)

    } catch (e) {

    }
}

export const triggerStartDailyAssistUrl = async (
    autopilot: AutopilotType,
    body: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const url = startDailyAssistAutopilotProdUrl

        const data: StartDailyAssistEventTriggerType = {
            autopilot,
            body,
        }

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const results = await axios.post(url, data, config)



    } catch (e) {

    }
}

export const triggerAddDailyFeaturesApplyUrl = async (
    autopilot: AutopilotType,
    body: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const url = addDailyFeaturesAutopilotProdUrl

        const data: AddDailyFeaturesApplyEventTriggerType = {
            autopilot,
            body,
        }

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const results = await axios.post(url, data, config)



    } catch (e) {

    }
}

export const deleteAutopilotsGivenUserId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const affectedRows = (await client.mutate<{ delete_Autopilot: { affected_rows: number, returning: AutopilotType[] } }>({
            mutation: deleteAutopilotsByUserId,
            variables: {
                userId,
            },
        }))?.data?.delete_Autopilot?.affected_rows


    } catch (e) {

    }
}

export const upsertManyAutopilot = async (
    client: ApolloClient<NormalizedCacheObject>,
    autopilots: AutopilotType[],
) => {
    try {
        const affectedRows = (await client.mutate<{ insert_Autopilot: { affected_rows: number, returning: AutopilotType[] } }>({
            mutation: upsertAutopilotMany,
            variables: {
                autopilots,
            },
        }))?.data?.insert_Autopilot?.affected_rows


    } catch (e) {

    }
}

export const listAutopilotsByUserId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const autopilotsDoc = (await client.query<{ Autopilot: AutopilotType[] }>({
            query: listAutopilotsGivenUserId,
            variables: {
                userId,
            },
            fetchPolicy: 'no-cache',
        }))?.data?.Autopilot

        return autopilotsDoc

    } catch (e) {

    }
}




