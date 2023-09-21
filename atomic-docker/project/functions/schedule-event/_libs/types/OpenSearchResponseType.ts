import { openTrainEventVectorName } from "@libs/constants"


export type OpenTrainEventSourceType = {
    userId: string,
    [openTrainEventVectorName]: number[],
    title: string,
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
                _source: OpenTrainEventSourceType,
            }
        ]
    }
}