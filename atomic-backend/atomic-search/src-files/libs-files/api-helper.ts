import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import createAwsOpensearchConnector from 'aws-opensearch-connector'
import { Client } from '@opensearch-project/opensearch'
import { Config, ConfigurationOptions, AWSError, Token } from 'aws-sdk'
import { APIVersions } from 'aws-sdk/lib/config'
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders'
import { openSearchEndPoint, searchIndex, vectorDimensions, eventVectorName, authApiToken, text2VectorUrl } from './constants'
import { esResponseBody } from './types'
import { Client as Client2 } from './opensearch-js-main'
import got from 'got'

export const getSearchClient = async () => {
    try {
        const credentials = await defaultProvider()()

        const connector = createAwsOpensearchConnector({
            credentials: credentials,
            region: process.env.AWS_REGION ?? 'us-east-1',
            getCredentials: function (cb) {
                return cb(null, null)
            },
            loadFromPath: function (path: string): Config & ConfigurationServicePlaceholders & APIVersions {
                return
            },
            update: function (options: ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions & { [key: string]: any }, allowUnknownKeys: any): void {
                return
            },
            getToken: function (callback: (err: AWSError, token: Token) => void): void {
                return
            },
            getPromisesDependency: function (): void | PromiseConstructor {
                throw new Error("Function not implemented.")
            },
            setPromisesDependency: function (dep: any): void {
                throw new Error("Function not implemented.")
            }
        })
        return new Client({
            ...connector,
            node: `https://${openSearchEndPoint}`,
        })
    } catch (e) {

    }

}

export const searchData3 = async (
    userId: string,
    searchVector: number[],
): Promise<esResponseBody> => {
    try {
        const client = await getSearchClient()
        const response = await client.search({
            index: searchIndex,
            body: {
                "size": vectorDimensions,
                "query": {
                    "script_score": {
                        "query": {
                            "bool": {
                                "filter": {
                                    "term": {
                                        userId,
                                    }
                                }
                            }
                        },
                        "script": {
                            "lang": "knn",
                            "source": "knn_score",
                            "params": {
                                "field": eventVectorName,
                                "query_value": searchVector,
                                "space_type": "cosinesimil"
                            }
                        }
                    }
                },
                "min_score": 1.2
            }
        })

        return response.body
    } catch (e) {

    }
}


export const putDataInSearch = async (
    id: string,
    vector: number[],
    userId: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.index({
            id,
            index: searchIndex,
            body: { [eventVectorName]: vector, userId },
            refresh: true
        })


    } catch (e) {

    }
}

export const updateDocInSearch3 = async (
    id: string,
    vector: number[],
    userId: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.update({
            index: searchIndex,
            id,
            body: { [eventVectorName]: vector, userId },
            refresh: true
        })


    } catch (e) {

    }
}

export const deleteDocInSearch3 = async (
    id: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.delete({
            id,
            index: searchIndex,
        })


    } catch (e) {

    }
}

export const listRepositoriesInSearch = async (

) => {
    try {
        const client = await getSearchClient()
        const response = await client.snapshot.get_repository()

        return response.body
    } catch (e) {

    }
}

export const getLocalSearchClient = async () => {
    const credentials = await defaultProvider()()
    const connector = createAwsOpensearchConnector({
        credentials: credentials,
        region: process.env.AWS_REGION ?? 'us-east-1',
        getCredentials: function (cb) {
            return cb(null, null)
        },
        loadFromPath: function (path: string): Config & ConfigurationServicePlaceholders & APIVersions {
            throw new Error('Function not implemented.')
        },
        update: function (options: ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions & { [key: string]: any }): void {
            throw new Error('Function not implemented.')
        },
        getToken: function (callback: (err: AWSError, token: Token) => void): void {
            throw new Error('Function not implemented.')
        },
        getPromisesDependency: function (): void | PromiseConstructor {
            throw new Error('Function not implemented.')
        },
        setPromisesDependency: function (dep: any): void {
            throw new Error('Function not implemented.')
        }
    })
    return new Client2({
        ...connector,
        node: `https://${openSearchEndPoint}`,
    })
}

export const listSnapshotsOfRepositoryOfSearchData = async (
    repository: string,
) => {
    try {
        // validate
        if (!repository) {

            return null
        }

        const client = await getLocalSearchClient()
        const response = await client.snapshot.get_repository_snapshots({ repository })

        return response.body
    } catch (e) {

    }
}

export const restoreSnapshotInSearch = async (
    repository: string,
    snapshot: string,
) => {
    try {
        // validate
        if (!repository) {

            return
        }

        if (!snapshot) {

            return
        }

        const client = await getSearchClient()
        const response = await client.snapshot.restore({
            repository,
            snapshot,
            body: {
                indices: searchIndex,
            }
        })



    } catch (e) {

    }
}


export const deleteIndexInSearch = async (
    index_name: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.indices.delete({
            index: index_name,
        })


    } catch (e) {

    }
}

export const createIndexInSearch3 = async () => {
    try {
        const client = await getSearchClient()

        const response = await client.indices.create({
            index: searchIndex,
            body: {
                "mappings": {
                    "properties": {
                        [eventVectorName]: {
                            "type": "knn_vector",
                            "dimension": vectorDimensions,
                        },
                        "userId": {
                            "type": "keyword"
                        }
                    }
                }
            },
        });



    } catch (e) {

    }
}


export const convertTextToVectorSpace2 = async (
    text: string,
): Promise<number[]> => {
    try {
        if (!text) {
            throw new Error('no text provided insdie convertTextToVectorSpace')
        }

        const vector: number[] = await got.post(
            text2VectorUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                },
                json: {
                    sentences: [text]
                },
            }
        ).json()


        return vector
    } catch (e) {

    }
}


