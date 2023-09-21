import { Request, Response } from 'express'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { listRepositoriesInSearch, listSnapshotsOfRepositoryOfSearchData, restoreSnapshotInSearch, deleteIndexInSearch, createTrainEventIndexInOpenSearch, createAllEventIndexInOpenSearch, getVectorInAllEventIndexInOpenSearch, putDataInTrainEventIndexInOpenSearch, deleteDocInTrainEventIndexInOpenSearch, updateDocInTrainEventIndexInOpenSearch, convertEventTitleToOpenAIVector, searchTrainEventIndexInOpenSearch, getVectorInTrainEventIndexInOpenSearch } from '@events_search/_libs/api-helper'


dayjs.extend(utc)


const opensearch = async (req: Request, res: Response) => {
  try {

    const body = req?.body

    if (!body) {
      return res.status(400).json({
        message: 'no body',
        event: body,
      })
    }

    if (body?.method === 'create index') {
      await createTrainEventIndexInOpenSearch()
      return res.status(200).json({
        message: `successfully taken care of create index in search!`,
        event: body,
      })
    }

    if (body?.method === 'create all event index') {
      await createAllEventIndexInOpenSearch()
      return res.status(200).json({
        message: `successfully taken care of create all index in search!`,
        event: body,
      })
    }

    if (body?.method === 'create') {
      if (!body?.eventId) {
        return res.status(400).json({
          message: 'no eventId',
          event: body,
        })
      }

      if (!body?.userId) {
        return res.status(400).json({
          message: 'no userId',
          event: body,
        })
      }

      if (!body?.eventDetails) {
        return res.status(400).json({
          message: 'no event',
          event: body,
        })
      }

      const vector = await getVectorInAllEventIndexInOpenSearch(body.eventId)
      await putDataInTrainEventIndexInOpenSearch(body.eventId, vector, body?.userId)
      return res.status(200).json({
        message: `event ${body.eventId} created`,
        event: body,
      })
    } else if (body?.method === 'delete') {
      if (!body?.eventId) {
        return res.status(400).json({
          message: 'no eventId',
          event: body,
        })
      }
      const results = await deleteDocInTrainEventIndexInOpenSearch(body.eventId)
      return res.status(200).json({
        message: `success ${results}`,
        event: body,
      })

    } else if (body?.method === 'update') {
      if (!body?.eventId) {
        return res.status(400).json({
          message: 'no eventId',
          event: body,
        })
      }

      if (!body?.eventDetails) {
        return res.status(400).json({
          message: 'no event details',
          event: body,
        })
      }

      if (!body?.userId) {
        return res.status(400).json({
          message: 'no userId',
          event: body,
        })
      }

      const vector = await getVectorInAllEventIndexInOpenSearch(body.eventId)

      await updateDocInTrainEventIndexInOpenSearch(body.eventId, vector, body?.userId)
      return res.status(200).json({
        message: `event ${body.eventId} updated`,
        event: body,
      })

    } else if (body?.method === 'get') {
      if (!body?.eventId) {
        return res.status(400).json({
          message: 'no eventId',
          event: body,
        })
      }

      if (!body?.userId) {
        return res.status(400).json({
          message: 'no userId',
          event: body,
        })
      }

      const vector = await getVectorInTrainEventIndexInOpenSearch(body.eventId)

      return res.status(200).json({
        message: `event ${body.eventId} updated`,
        event: vector,
      })

    } else if (body?.method === 'search') {
      if (!body?.search) {
        return res.status(400).json({
          message: 'no search',
          event: body,
        })
      }
      const vector = await convertEventTitleToOpenAIVector(body.search)
      const results = await searchTrainEventIndexInOpenSearch(body?.userId, vector)
      return res.status(200).json({
        message: `success ${results}`,
        event: results
      })

    } else if (body?.method === 'list repositories') {
      const results = await listRepositoriesInSearch()
      return res.status(200).json({
        message: `success listing repositories`,
        event: results
      })
    } else if (body?.method === 'list snapshots') {
      if (!body?.repository) {
        return res.status(400).json({
          message: 'no repositoryId',
          event: body,
        })
      }
      const results = await listSnapshotsOfRepositoryOfSearchData(body?.repository)
      return res.status(200).json({
        message: `success listing snapshots`,
        event: results
      })
    } else if (body?.method === 'restore snapshot') {
      if (!body?.repository) {
        return res.status(400).json({
          message: 'no repository',
          event: body,
        })
      }

      if (!body?.snapshot) {
        return res.status(400).json({
          message: 'no snapshot',
          event: body,
        })
      }

      const results = await restoreSnapshotInSearch(body?.repository, body?.snapshot)
      return res.status(200).json({
        message: `success restoring snapshot`,
        event: results
      })
    } else if (body?.method === 'delete index') {

      if (!body?.index) {
        return res.status(400).json({
          message: 'no index',
          event: body,
        })
      }

      const results = await deleteIndexInSearch(body?.index)
      return res.status(200).json({
        message: `success deleting index`,
        event: results
      })
    }


    return res.status(200).json({
      message: `successfully taken care of googleCalendarySync!`,
      event: body,
    })
  } catch (e) {


    return res.status(400).json({
      message: `error processing opensearch: message: ${e?.message}, code: ${e?.statusCode}`,
      event: e,
    })
  }
}

export default opensearch
