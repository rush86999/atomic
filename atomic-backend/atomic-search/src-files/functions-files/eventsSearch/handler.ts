import { formatJSONResponse, formatErrorJSONResponse } from '../../libs/api-gateway';
import { middyfy } from '../../libs/lambda';
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { searchData3, putDataInSearch, updateDocInSearch3, deleteDocInSearch3, listRepositoriesInSearch, listSnapshotsOfRepositoryOfSearchData, restoreSnapshotInSearch, deleteIndexInSearch, createIndexInSearch3, convertTextToVectorSpace2 } from '../../libs/api-helper';



dayjs.extend(utc)



const opensearch = async (event) => {
  try {

    const body = event?.body

    if (!body) {
      return formatErrorJSONResponse({
        message: 'no body',
        event,
      })
    }

    if (body?.method === 'create index') {
      await createIndexInSearch3()
      return formatJSONResponse({
        message: `successfully taken care of create index in search!`,
        event,
      })
    }

    if (body?.method === 'create') {
      if (!body?.eventId) {
        return formatErrorJSONResponse({
          message: 'no eventId',
          event,
        })
      }

      if (!body?.userId) {
        return formatErrorJSONResponse({
          message: 'no userId',
          event,
        })
      }

      if (!body?.eventDetails) {
        return formatErrorJSONResponse({
          message: 'no event',
          event,
        })
      }

      const vector = await convertTextToVectorSpace2(body.eventDetails)
      await putDataInSearch(body.eventId, vector, body?.userId)
      return formatJSONResponse({
        message: `event ${body.eventId} created`,
        event,
      })
    } else if (body?.method === 'delete') {
      if (!body?.eventId) {
        return formatErrorJSONResponse({
          message: 'no eventId',
          event,
        })
      }
      const results = await deleteDocInSearch3(body.eventId)
      return formatJSONResponse({
        message: `success ${results}`,
        event,
      })

    } else if (body?.method === 'update') {
      if (!body?.eventId) {
        return formatErrorJSONResponse({
          message: 'no eventId',
          event,
        })
      }

      if (!body?.eventDetails) {
        return formatErrorJSONResponse({
          message: 'no event details',
          event,
        })
      }

      if (!body?.userId) {
        return formatErrorJSONResponse({
          message: 'no userId',
          event,
        })
      }

      const vector = await convertTextToVectorSpace2(body.eventDetails)

      await updateDocInSearch3(body.eventId, vector, body?.userId)
      return formatJSONResponse({
        message: `event ${body.eventId} updated`,
        event,
      })

    } else if (body?.method === 'search') {
      if (!body?.search) {
        return formatErrorJSONResponse({
          message: 'no search',
          event,
        })
      }
      const vector = await convertTextToVectorSpace2(body.search)
      const results = await searchData3(body?.userId, vector)
      return formatJSONResponse({
        message: `success ${results}`,
        event: results
      })

    } else if (body?.method === 'list repositories') {
      const results = await listRepositoriesInSearch()
      return formatJSONResponse({
        message: `success listing repositories`,
        event: results
      })
    } else if (body?.method === 'list snapshots') {
      if (!body?.repository) {
        return formatErrorJSONResponse({
          message: 'no repositoryId',
          event,
        })
      }
      const results = await listSnapshotsOfRepositoryOfSearchData(body?.repository)
      return formatJSONResponse({
        message: `success listing snapshots`,
        event: results
      })
    } else if (body?.method === 'restore snapshot') {
      if (!body?.repository) {
        return formatErrorJSONResponse({
          message: 'no repository',
          event,
        })
      }

      if (!body?.snapshot) {
        return formatErrorJSONResponse({
          message: 'no snapshot',
          event,
        })
      }

      const results = await restoreSnapshotInSearch(body?.repository, body?.snapshot)
      return formatJSONResponse({
        message: `success restoring snapshot`,
        event: results
      })
    } else if (body?.method === 'delete index') {

      if (!body?.index) {
        return formatErrorJSONResponse({
          message: 'no index',
          event,
        })
      }

      const results = await deleteIndexInSearch(body?.index)
      return formatJSONResponse({
        message: `success deleting index`,
        event: results
      })
    }


    return formatJSONResponse({
      message: `successfully taken care of googleCalendarySync!`,
      event,
    })
  } catch (e) {


    return formatErrorJSONResponse({
      message: `error processing opensearch: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    })
  }
}

export const main = middyfy(opensearch)
