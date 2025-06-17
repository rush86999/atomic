import { defaultOpenAIAPIKey, openAllEventIndex, openAllEventVectorName, openTrainEventIndex } from "@google_calendar_sync/_libs/constants";
import OpenAI from "openai";
import { Client } from '@opensearch-project/opensearch';
const openai = new OpenAI({
    apiKey: defaultOpenAIAPIKey,
});
export const convertEventTitleToOpenAIVector = async (title) => {
    try {
        const embeddingRequest = {
            model: 'text-embedding-3-small',
            input: title,
        };
        const res = await openai.embeddings.create(embeddingRequest);
        console.log(res, ' res inside convertEventTitleToOpenAIVectors');
        return res?.data?.[0]?.embedding;
    }
    catch (e) {
        console.log(e, ' unable to convert event title to openaivectors');
    }
};
export const getSearchClient = async () => {
    try {
        return new Client({
            node: process.env.OPENSEARCH_ENDPOINT,
            auth: {
                username: process.env.OPENSEARCH_USERNAME,
                password: process.env.OPENSEARCH_PASSWORD,
            }
        });
    }
    catch (e) {
        console.log(e, ' unable to get credentials from getSearchClient');
    }
};
export const putDataInAllEventIndexInOpenSearch = async (id, vector, userId, start_date, end_date) => {
    try {
        const client = await getSearchClient();
        const response = await client.index({
            id,
            index: openAllEventIndex,
            body: { [openAllEventVectorName]: vector, userId, start_date, end_date },
            refresh: true
        });
        console.log('Adding document:');
        console.log(response.body);
    }
    catch (e) {
        console.log(e, ' unable to put data into search');
    }
};
export const deleteDocInAllEventIndexInOpenSearch = async (id) => {
    try {
        const client = await getSearchClient();
        const response = await client.delete({
            id,
            index: openAllEventIndex,
        });
        console.log('Deleting document in search:');
        console.log(response.body);
    }
    catch (e) {
        console.log(e, ' unable to delete doc');
    }
};
export const listAllEventWithEventOpenSearch = async (userId, qVector, startDate, endDate) => {
    try {
        const client = await getSearchClient();
        console.log(qVector, ' qVector');
        if (typeof qVector[0] !== 'number') {
            throw new Error('qVector is not a number');
        }
        const filter_conditions = {
            "bool": {
                "must": [
                    { "term": { "userId": userId } },
                    { "range": { "start_date": { "gte": startDate, "lte": endDate } } },
                    { "range": { "end_date": { "gte": startDate, "lte": endDate } } }
                ]
            }
        };
        const response = await client.search({
            index: openAllEventIndex,
            body: {
                "size": 10,
                "query": {
                    "script_score": {
                        "query": {
                            "bool": {
                                "filter": filter_conditions
                            }
                        },
                        "script": {
                            "lang": "knn",
                            "source": "knn_score",
                            "params": {
                                "field": openAllEventVectorName,
                                "query_value": qVector,
                                "space_type": "cosinesimil"
                            }
                        }
                    }
                },
                sort: [
                    {
                        start_date: {
                            order: "asc"
                        }
                    }
                ],
                "min_score": 1.2
            }
        });
        console.log(response, ' search data in search engine');
        return response.body;
    }
    catch (e) {
        console.log(e, ' unable to search data');
    }
};
export const bulkPutDataInAllEventIndexInOpenSearch = async (bulkImport) => {
    try {
        const bulkBody = [];
        for (const body of bulkImport) {
            bulkBody.push({ index: { _index: openAllEventIndex, _id: body?.id } });
            bulkBody.push(body?.body);
        }
        const client = await getSearchClient();
        const bulkRequest = {
            body: bulkBody,
            refresh: true,
        };
        const response = await client.bulk(bulkRequest);
        console.log('Adding documents in bulk:');
        console.log(response.body);
    }
    catch (e) {
        console.log(e, ' unable to put data into search');
    }
};
export const bulkDeleteDocInAllEventIndexInOpenSearch = async (ids) => {
    try {
        const bulkBody = [];
        for (const id of ids) {
            bulkBody.push({ delete: { _index: openAllEventIndex, _id: id } });
        }
        const client = await getSearchClient();
        const bulkRequest = {
            body: bulkBody,
            refresh: true,
        };
        const response = await client.bulk(bulkRequest);
        console.log('Deleting documents in bulk:');
        console.log(response.body);
    }
    catch (e) {
        console.log(e, ' unable to delete doc');
    }
};
export const bulkDeleteDocInTrainEventIndexInOpenSearch = async (ids) => {
    try {
        const bulkBody = [];
        for (const id of ids) {
            bulkBody.push({ delete: { _index: openTrainEventIndex, _id: id } });
        }
        const client = await getSearchClient();
        const bulkRequest = {
            body: bulkBody,
            refresh: true,
        };
        const response = await client.bulk(bulkRequest);
        console.log('Deleting documents in bulk:');
        console.log(response.body);
    }
    catch (e) {
        console.log(e, ' unable to delete doc');
    }
};
