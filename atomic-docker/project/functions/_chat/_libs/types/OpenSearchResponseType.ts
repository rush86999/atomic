import { openAllEventVectorName } from "@libs/constants"


export type OpenAllEventSourceType = {
    userId: string,
    [openAllEventVectorName]: number[],
    start_date: string,
    end_date: string,
    title: string,
}

export type OpenSearchGetResponseBodyType = {
    _index: string,
    _type: string,
    _id: string,
    _score: number,
    _source: OpenAllEventSourceType,
}

export type OpenSearchResponseBodyType = {
    took?: number,
    timed_out?: false,
    _shards?: {
        total: number,
        successful: number,
        skipped: number,
        failed: number
    },
    hits?: {
        total: {
            value: number,
            relation: string
        },
        max_score: number,
        hits?: [
            {
                _index: string,
                _type: string,
                _id: string,
                _score: number,
                _source: OpenAllEventSourceType,
            }
        ]
    }
}