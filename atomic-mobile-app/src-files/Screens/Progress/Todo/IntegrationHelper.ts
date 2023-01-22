import { DataStore } from '@aws-amplify/datastore'
import { Auth } from 'aws-amplify'
import { dayjs } from '@app/date-utils'
import axios from 'axios'

import {
  Integration,
  DailyToDo,
  WeeklyToDo,
  GroceryToDo,
  MasterToDo,
  User,
  ToDoStatus,
} from '@models'

import {
  _createDailyTaskToStore,
} from '@progress/Todo/UserTaskHelper'
import { createDailyDeadline, createWeeklyDeadline, submitDailyTaskEventForQueue, submitEventForQueue } from '@progress/Todo/UserTaskHelper2'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'


export enum TableName {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MASTER = 'Master',
  GROCERY = 'Grocery',
}

enum AppName {
  NOTION = 'Notion',
}

type type = 'created_time' | 'last_edited_time' | 'title' | 'select'

type selectName = 'To Do' | 'Doing' | 'Done'

type select = {
  color: string,
  id: string,
  name: selectName,
}

type resultTitle = {
  annotations: {
    bold: boolean,
    code: boolean,
    color: string,
    italic: boolean,
    strikethrough: boolean,
    underline: boolean,
  },
  plain_text: string,
  text: { content: string | null, link: string | null },
  type: type,
}

type result = {
  id: string,
  properties: {
    'Date Created': {
      id: string,
      created_time: string,
      type: type,
    },
    'Date Edited': {
      id: string,
      last_edited_time: string,
      type: type,
    },
    Status: {
      id: string,
      select: select,
      type: type,
    }
    Name: {
      id: string,
      title: resultTitle[],
      type: type,
    }
  }
}

type resultData = {
  data: {
    results: result[]
  }
}

type objectResult = 'block' | 'page'

type blockText = {
  annotations: {
    bold: boolean,
    code: boolean,
    color: string,
    italic: boolean,
    strikethrough: boolean,
    underline: boolean,
  },
  plain_text: string,
  text: { content: string | null, link: string | null },
  type: type,
  href: string | null,
}

type resultBlock = {
  archived: boolean,
  created_time: string,
  has_children: boolean,
  id: string,
  last_edited_time: string,
  object: objectResult,
  to_do: {
    checked: boolean,
    text: blockText[],
  }
}

type blockData = {
  data: {
    results: resultBlock[],
  }
}

type todoResponse = {
  id: string,
  text: string,
  checked: boolean,
}

type responseData = {
  id: string,
  status: selectName,
  title: string,
  created_time: string,
  last_edited_time: string,
  list?: todoResponse[],
}




const CALENDARNAME = 'Atomic Calendar'

const statusKey = {
  'To Do': ToDoStatus.TODO,
  'Doing': ToDoStatus.DOING,
  'Done': ToDoStatus.DONE,
}

export const deleteNotionBlock = async (
  tableName: string,
  syncId: string,
) => {
  try {
    const integration = await getIntegrationInfo(AppName.NOTION, tableName)

    const url = `https://api.notion.com/v1/blocks/${syncId}`
    const config = {
      headers: {
        Authorization: `Bearer ${integration?.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2021-08-16',
      },
    }

    await axios.delete(url, config)
  } catch (e: any) {




  }
}

export const queryNotion = async (client: ApolloClient<NormalizedCacheObject>) => {
  try {
    const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()

    const dailyIntegration = await getIntegrationInfo(AppName.NOTION, 'Daily')
    const weeklyIntegration = await getIntegrationInfo(AppName.NOTION, 'Weekly')
    const masterIntegration = await getIntegrationInfo(AppName.NOTION, 'Master')
    const groceryIntegration = await getIntegrationInfo(AppName.NOTION, 'Grocery')

    const dailyTaskResults = await queryNotionDB(dailyIntegration)
    const weeklyTaskResults = await queryNotionDB(weeklyIntegration)
    const masterTaskResults = await queryNotionDB(masterIntegration)
    const groceryTaskResults = await queryNotionDB(groceryIntegration)

    await processTaskFromNotion(
      dailyTaskResults,
      TableName.DAILY,
      sub,
      client,
    )

    await processTaskFromNotion(
      weeklyTaskResults,
      TableName.WEEKLY,
      sub,
      client,
    )

    await processTaskFromNotion(
      masterTaskResults,
      TableName.MASTER,
      sub,
      client,
    )

    await processTaskFromNotion(
      groceryTaskResults,
      TableName.GROCERY,
      sub,
      client,
    )



  } catch (e) {

  }
}

export const createTaskInStore = async (
  userId: string,
  type: TableName,
  notes?: string,
  date?: string,
  nextDay?: boolean,
  event?: boolean,
  syncId?: string,
  syncName?: string,
  startDate?: string,
  endDate?: string,
  status?: ToDoStatus,
  parentId?: string,
  order?: number,
) => {
  try {
    if (type === TableName.DAILY) {
      const dailyTask = await DataStore.save(
        new DailyToDo({
          userId,
          notes,
          date,
          nextDay,
          event,
          startDate,
          endDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      )


      return dailyTask.id
    } else if (type === TableName.WEEKLY) {

      const weeklyTask = await DataStore.save(
        new WeeklyToDo({
          userId,
          notes,
          date,
          nextDay,
          event,
          startDate,
          endDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      )


      return weeklyTask.id
    } else if (type === TableName.MASTER) {

      const masterTask = await DataStore.save(
        new MasterToDo({
          userId,
          notes,
          date,
          nextDay,
          event,
          startDate,
          endDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      )


      return masterTask.id
    } else if (type === TableName.GROCERY) {

      const groceryTask = await DataStore.save(
        new GroceryToDo({
          userId,
          notes,
          date,
          nextDay,
          event,
          startDate,
          endDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      )


      return groceryTask.id
    }
  } catch (e) {

  }
}

export const updateTaskInStore = async (
  type: TableName,
  id: string,
  notes?: string,
  date?: string,
  event?: boolean,
  completed?: boolean,
  startDate?: string,
  endDate?: string,
  completedDate?: string,
  scheduleId?: string,
  softDeadline?: string,
  hardDeadline?: string,
  important?: boolean,
  status?: ToDoStatus,
  parentId?: string,
  order?: number,
  eventId?: string,
  duration?: number,
) => {

  try {
    if (type === TableName.DAILY) {
      const dailyTaskNote = await DataStore.query(DailyToDo, id)
      if (!(dailyTaskNote?.id)) {
        return
      }
      const result = await DataStore.save(
        DailyToDo.copyOf(dailyTaskNote, updated => {
          if (
            (notes !== undefined)
            && (dailyTaskNote.notes !== notes)
          ) {
            updated.notes = notes
          }

          if (completed !== undefined) {
            if (dailyTaskNote.completed !== completed) {
              updated.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (dailyTaskNote.startDate !== startDate) {
              updated.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            if (dailyTaskNote.endDate !== endDate) {
              updated.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (dailyTaskNote.completedDate !== completedDate) {
              updated.completedDate = completedDate
            }
          }

          if (startDate) {
            if (dailyTaskNote.nextDay !== dayjs(startDate).isTomorrow()) {
              updated.nextDay = dayjs(startDate).isTomorrow()
            }
          } else {
            updated.nextDay = false
          }

          if (date !== undefined) {
            if (dailyTaskNote.date !== date) {
              updated.date = date
            }
          }

          if (event !== undefined) {
            if (dailyTaskNote.event !== event) {
              updated.event = event
            }
          }

          if (scheduleId !== undefined) {
            if (dailyTaskNote.scheduleId !== scheduleId) {
              updated.scheduleId = scheduleId
            }
          }

          if (softDeadline !== undefined) {
            if (dailyTaskNote.softDeadline !== softDeadline) {
              updated.softDeadline = softDeadline
            }
          }

          if (hardDeadline !== undefined) {
            if (dailyTaskNote.hardDeadline !== hardDeadline) {
              updated.hardDeadline = hardDeadline
            }
          }

          if (important !== undefined) {
            if (dailyTaskNote.important !== important) {
              updated.important = important
            }
          }

          if (status !== undefined) {
            if (dailyTaskNote.status !== status) {
              updated.status = status
            }
          }

          if (parentId !== undefined) {
            if (dailyTaskNote.parentId !== parentId) {
              updated.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (dailyTaskNote.order !== order) {
              updated.order = order
            }
          }

          if (eventId !== undefined) {
            if (dailyTaskNote.eventId !== eventId) {
              updated.eventId = eventId
            }
          }

          if (duration !== undefined) {
            if (dailyTaskNote.duration !== duration) {
              updated.duration = duration
            }
          }

        })
      )
      return result
    } else if (type === TableName.WEEKLY) {
      const weeklyTaskNote = await DataStore.query(WeeklyToDo, id)
      if (!(weeklyTaskNote?.id)) {
        return
      }
      const result = await DataStore.save(
        WeeklyToDo.copyOf(
          weeklyTaskNote, updated => {
            if (
              (notes !== undefined)
              && (weeklyTaskNote.notes !== notes)
            ) {
              updated.notes = notes
            }

            if (completed !== undefined) {
              if (weeklyTaskNote.completed !== completed) {
                updated.completed = completed
              }
            }

            if (startDate !== undefined) {
              if (weeklyTaskNote.startDate !== startDate) {
                updated.startDate = startDate
              }
            }

            if (endDate !== undefined) {
              if (weeklyTaskNote.endDate !== endDate) {
                updated.endDate = endDate
              }
            }

            if (completedDate !== undefined) {
              if (weeklyTaskNote.completedDate !== completedDate) {
                updated.completedDate = completedDate
              }
            }


            if (startDate) {
              if (weeklyTaskNote.nextDay !== dayjs(startDate).isTomorrow()) {
                updated.nextDay = dayjs(startDate).isTomorrow()
              }
            } else {
              updated.nextDay = false
            }

            if (date !== undefined) {
              if (weeklyTaskNote.date !== date) {
                updated.date = date
              }
            }

            if (event !== undefined) {
              if (weeklyTaskNote.event !== event) {
                updated.event = event
              }
            }

            if (scheduleId !== undefined) {
              if (weeklyTaskNote.scheduleId !== scheduleId) {
                updated.scheduleId = scheduleId
              }
            }

            if (softDeadline !== undefined) {
              if (weeklyTaskNote.softDeadline !== softDeadline) {
                updated.softDeadline = softDeadline
              }
            }

            if (hardDeadline !== undefined) {
              if (weeklyTaskNote.hardDeadline !== hardDeadline) {
                updated.hardDeadline = hardDeadline
              }
            }

            if (important !== undefined) {
              if (weeklyTaskNote.important !== important) {
                updated.important = important
              }
            }

            if (status !== undefined) {
              if (weeklyTaskNote.status !== status) {
                updated.status = status
              }
            }

            if (parentId !== undefined) {
              if (weeklyTaskNote.parentId !== parentId) {
                updated.parentId = parentId
              }
            }

            if (order !== undefined) {
              if (weeklyTaskNote.order !== order) {
                updated.order = order
              }
            }

            if (eventId !== undefined) {
              if (weeklyTaskNote.eventId !== eventId) {
                updated.eventId = eventId
              }
            }

            if (duration !== undefined) {
              if (weeklyTaskNote.duration !== duration) {
                updated.duration = duration
              }
            }

          })
      )
      return result
    } else if (type === TableName.MASTER) {
      const masterTaskNote = await DataStore.query(MasterToDo, id)
      if (!(masterTaskNote?.id)) {
        return
      }
      const result = await DataStore.save(
        MasterToDo.copyOf(
          masterTaskNote, updated => {
            if (
              (notes !== undefined)
              && (masterTaskNote.notes !== notes)
            ) {
              updated.notes = notes
            }

            if (completed !== undefined) {
              if (masterTaskNote.completed !== completed) {
                updated.completed = completed
              }
            }

            if (startDate !== undefined) {
              if (masterTaskNote.startDate !== startDate) {
                updated.startDate = startDate
              }
            }

            if (endDate !== undefined) {
              if (masterTaskNote.endDate !== endDate) {
                updated.endDate = endDate
              }
            }

            if (completedDate !== undefined) {
              if (masterTaskNote.completedDate !== completedDate) {
                updated.completedDate = completedDate
              }
            }


            if (startDate) {
              if (masterTaskNote.nextDay !== dayjs(startDate).isTomorrow()) {
                updated.nextDay = dayjs(startDate).isTomorrow()
              }
            } else {
              updated.nextDay = false
            }

            if (date !== undefined) {
              if (masterTaskNote.date !== date) {
                updated.date = date
              }
            }

            if (event !== undefined) {
              if (masterTaskNote.event !== event) {
                updated.event = event
              }
            }

            if (scheduleId !== undefined) {
              if (masterTaskNote.scheduleId !== scheduleId) {
                updated.scheduleId = scheduleId
              }
            }

            if (softDeadline !== undefined) {
              if (masterTaskNote.softDeadline !== softDeadline) {
                updated.softDeadline = softDeadline
              }
            }

            if (hardDeadline !== undefined) {
              if (masterTaskNote.hardDeadline !== hardDeadline) {
                updated.hardDeadline = hardDeadline
              }
            }

            if (important !== undefined) {
              if (masterTaskNote.important !== important) {
                updated.important = important
              }
            }

            if (status !== undefined) {
              if (masterTaskNote.status !== status) {
                updated.status = status
              }
            }

            if (parentId !== undefined) {
              if (masterTaskNote.parentId !== parentId) {
                updated.parentId = parentId
              }
            }

            if (order !== undefined) {
              if (masterTaskNote.order !== order) {
                updated.order = order
              }
            }

            if (eventId !== undefined) {
              if (masterTaskNote.eventId !== eventId) {
                updated.eventId = eventId
              }
            }

            if (duration !== undefined) {
              if (masterTaskNote.duration !== duration) {
                updated.duration = duration
              }
            }
          })
      )
      return result
    } else if (type === TableName.GROCERY) {
      const groceryTaskNote = await DataStore.query(GroceryToDo, id)
      if (!(groceryTaskNote?.id)) {
        return
      }
      const result = await DataStore.save(
        GroceryToDo.copyOf(groceryTaskNote, updated => {
          if (
            (notes !== undefined)
            && (groceryTaskNote.notes !== notes)
          ) {
            updated.notes = notes
          }

          if (completed !== undefined) {
            if (groceryTaskNote.completed !== completed) {
              updated.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (updated.startDate !== startDate) {
              updated.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            if (groceryTaskNote.endDate !== endDate) {
              updated.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (groceryTaskNote.completedDate !== completedDate) {
              updated.completedDate = completedDate
            }
          }


          if (startDate) {
            if (groceryTaskNote.nextDay !== dayjs(startDate).isTomorrow()) {
              updated.nextDay = dayjs(startDate).isTomorrow()
            }
          } else {
            updated.nextDay = false
          }

          if (date !== undefined) {
            if (groceryTaskNote.date !== date) {
              updated.date = date
            }
          }

          if (event !== undefined) {
            if (groceryTaskNote.event !== event) {
              updated.event = event
            }
          }

          if (scheduleId !== undefined) {
            if (groceryTaskNote.scheduleId !== scheduleId) {
              updated.scheduleId = scheduleId
            }
          }

          if (softDeadline !== undefined) {
            if (groceryTaskNote.softDeadline !== softDeadline) {
              updated.softDeadline = softDeadline
            }
          }

          if (hardDeadline !== undefined) {
            if (groceryTaskNote.hardDeadline !== hardDeadline) {
              updated.hardDeadline = hardDeadline
            }
          }

          if (important !== undefined) {
            if (groceryTaskNote.important !== important) {
              updated.important = important
            }
          }

          if (status !== undefined) {
            if (groceryTaskNote.status !== status) {
              updated.status = status
            }
          }

          if (parentId !== undefined) {
            if (groceryTaskNote.parentId !== parentId) {
              updated.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (groceryTaskNote.order !== order) {
              updated.order = order
            }
          }

          if (eventId !== undefined) {
            if (groceryTaskNote.eventId !== eventId) {
              updated.eventId = eventId
            }
          }

          if (duration !== undefined) {
            if (groceryTaskNote.duration !== duration) {
              updated.duration = duration
            }
          }
        })
      )
      return result
    }
  } catch (e) {

  }
}

export const processTaskFromNotion = async (
  results: responseData[],
  type: TableName,
  sub: string,
  client: ApolloClient<NormalizedCacheObject>,
) => {


  try {
    if (!(results?.[0]?.id)) {
      return
    }

    const users = await DataStore.query(User, c => c.sub('eq', sub))
    if (!users?.[0]?.id) {
      return
    }
    const [user] = users


    const promises = results.map(async (responseData) => {

      if (type === TableName.DAILY) {
        const dailyToDos = await DataStore.query(DailyToDo, c => c.userId('eq', user.id)
          .syncName('eq', AppName.NOTION).syncId('eq', responseData?.id))

        if (dailyToDos?.[0]?.id) {
          const [dailyToDo] = dailyToDos
          if (dayjs(dailyToDo.date).isAfter(responseData?.last_edited_time)) {
            return
          }
          await updateTaskNote(
            type,
            dailyToDo.id,
            responseData?.title,
            dailyToDo.date,
            responseData?.last_edited_time,
            responseData?.status,
            dailyToDo.event,
            dailyToDo?.completed,
            dailyToDo?.startDate,
            dailyToDo?.endDate,
            dailyToDo?.completedDate,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text, checked } = item
            const dailyToDos = await DataStore.query(DailyToDo, c => c.userId('eq', user.id)
              .syncName('eq', AppName.NOTION).syncId('eq', id))

            if (dailyToDos?.[0]?.id) {
              const [dailyToDo] = dailyToDos
              return updateTaskNote(
                type,
                dailyToDo.id,
                text,
                dailyToDo.date,
                responseData?.last_edited_time,
                responseData?.status,
                dailyToDo.event,
                checked,
                dailyToDo?.startDate,
                dailyToDo?.endDate,
                dailyToDo?.completedDate,
              )
            }
          })

          return Promise.all(subTaskPromises)
        } else {

          const taskIdOfParent = await createTaskNote(
            type,
            responseData?.title,
            responseData?.id,
            AppName.NOTION,
            user.id,
            responseData?.status,
          )
          if (responseData?.status === 'To Do') {
            const parentEvent = await createDailyDeadline(
              client,
              user.id,
              taskIdOfParent,
              responseData?.title,
              1,
              dayjs().hour(22).format(),
              'soft',
              20,
            )

            if (parentEvent) {
              await submitDailyTaskEventForQueue(parentEvent, client, sub)
              await updateTaskNote(
                type,
                taskIdOfParent,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                parentEvent?.id,
                20,
              )
            }
          }
          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text } = item

            const taskId = await createTaskNote(
              type,
              text,
              id,
              AppName.NOTION,
              user.id,
              responseData?.status,
              taskIdOfParent,
            )
            if (responseData?.status === 'To Do') {
              const event = await createDailyDeadline(
                client,
                user.id,
                taskId,
                text,
                1,
                dayjs().hour(22).format(),
                'soft',
                20,
              )

              if (event) {
                await submitDailyTaskEventForQueue(event, client, sub)

                await updateTaskNote(
                  type,
                  taskId,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  event?.id,
                  20,
                )
              }
            }
          })

          return Promise.all(subTaskPromises)
        }

      } else if (type === TableName.WEEKLY) {

        const weeklyToDos = await DataStore.query(WeeklyToDo, c => c.userId('eq', user.id)
          .syncName('eq', AppName.NOTION).syncId('eq', responseData?.id))

        if (weeklyToDos?.[0]?.id) {
          const [weeklyToDo] = weeklyToDos
          if (dayjs(weeklyToDo.date).isAfter(responseData?.last_edited_time)) {
            return
          }
          await updateTaskNote(
            type,
            weeklyToDo.id,
            responseData?.title,
            weeklyToDo.date,
            responseData?.last_edited_time,
            responseData?.status,
            weeklyToDo.event,
            weeklyToDo?.completed,
            weeklyToDo?.startDate,
            weeklyToDo?.endDate,
            weeklyToDo?.completedDate,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text, checked } = item
            const weeklyToDos = await DataStore.query(WeeklyToDo, c => c.userId('eq', user.id)
              .syncName('eq', AppName.NOTION).syncId('eq', id))

            if (weeklyToDos?.[0]?.id) {
              const [weeklyToDo] = weeklyToDos
              if (dayjs(weeklyToDo.date).isAfter(responseData?.last_edited_time)) {
                return
              }
              return updateTaskNote(
                type,
                weeklyToDo.id,
                text,
                weeklyToDo.date,
                responseData?.last_edited_time,
                responseData?.status,
                weeklyToDo.event,
                checked,
                weeklyToDo?.startDate,
                weeklyToDo?.endDate,
                weeklyToDo?.completedDate,
              )
            }
          })

          return Promise.all(subTaskPromises)
        } else {

          const taskIdOfParent = await createTaskNote(
            type,
            responseData?.title,
            responseData?.id,
            AppName.NOTION,
            user.id,
            responseData?.status,
          )

          if (responseData?.status === 'To Do') {

              const parentEvent = await createWeeklyDeadline(
                client,
                user.id,
                taskIdOfParent,
                responseData?.title,
                1,
                dayjs().add(1, 'week').hour(22).format(),
                'soft',
                20,
              )


              if (parentEvent) {
                await submitEventForQueue(parentEvent, client, sub)
                await updateTaskNote(
                  type,
                  taskIdOfParent,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  parentEvent?.id,
                  20,
                )
              }
            
          }

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text } = item

            await createTaskNote(
              type,
              text,
              id,
              AppName.NOTION,
              user.id,
              responseData?.status,
              taskIdOfParent,
            )

            if (responseData?.status === 'To Do') {

                const event = await createDailyDeadline(
                  client,
                  user.id,
                  id,
                  text,
                  1,
                  dayjs().add(1, 'week').hour(22).format(),
                  'soft',
                  20,
                )

                if (event) {
                  await submitEventForQueue(event, client, sub)

                  await updateTaskNote(
                    type,
                    id,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.id,
                    20,
                  )
                }
            }
          })

          return Promise.all(subTaskPromises)
        }
      } else if (type === TableName.MASTER) {
        const masterToDos = await DataStore.query(MasterToDo, c => c.userId('eq', user.id)
          .syncName('eq', AppName.NOTION).syncId('eq', responseData?.id))

        if (masterToDos?.[0]?.id) {
          const [masterToDo] = masterToDos
          if (dayjs(masterToDo.date).isAfter(responseData?.last_edited_time)) {
            return
          }
          await updateTaskNote(
            type,
            masterToDo.id,
            responseData?.title,
            masterToDo.date,
            responseData?.last_edited_time,
            responseData?.status,
            masterToDo.event,
            masterToDo?.completed,
            masterToDo?.startDate,
            masterToDo?.endDate,
            masterToDo?.completedDate,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text, checked } = item
            const masterToDos = await DataStore.query(MasterToDo, c => c.userId('eq', user.id)
              .syncName('eq', AppName.NOTION).syncId('eq', id))

            if (masterToDos?.[0]?.id) {
              const [masterToDo] = masterToDos
              return updateTaskNote(
                type,
                masterToDo.id,
                text,
                masterToDo.date,
                responseData?.last_edited_time,
                responseData?.status,
                masterToDo.event,
                checked,
                masterToDo?.startDate,
                masterToDo?.endDate,
                masterToDo?.completedDate,
              )
            }
          })

          return Promise.all(subTaskPromises)
        } else {

          const parentId = await createTaskNote(
            type,
            responseData?.title,
            responseData?.id,
            AppName.NOTION,
            user.id,
            responseData?.status,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text } = item

            return createTaskNote(
              type,
              text,
              id,
              AppName.NOTION,
              user.id,
              responseData?.status,
              parentId,
            )
          })

          return Promise.all(subTaskPromises)
        }
      } else if (type === TableName.GROCERY) {

        const groceryToDos = await DataStore.query(GroceryToDo, c => c.userId('eq', user.id)
          .syncName('eq', AppName.NOTION).syncId('eq', responseData?.id))

        if (groceryToDos?.[0]?.id) {
          const [groceryToDo] = groceryToDos
          if (dayjs(groceryToDo.date).isAfter(responseData?.last_edited_time)) {
            return
          }
          await updateTaskNote(
            type,
            groceryToDo.id,
            responseData?.title,
            groceryToDo.date,
            responseData?.last_edited_time,
            responseData?.status,
            groceryToDo.event,
            groceryToDo?.completed,
            groceryToDo?.startDate,
            groceryToDo?.endDate,
            groceryToDo?.completedDate,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text, checked } = item
            const groceryToDos = await DataStore.query(GroceryToDo, c => c.userId('eq', user.id)
              .syncName('eq', AppName.NOTION).syncId('eq', id))

            if (groceryToDos?.[0]?.id) {
              const [groceryToDo] = groceryToDos
              if (dayjs(groceryToDo.date).isAfter(responseData?.last_edited_time)) {
                return
              }
              return updateTaskNote(
                type,
                groceryToDo.id,
                text,
                groceryToDo.date,
                responseData?.last_edited_time,
                responseData?.status,
                groceryToDo.event,
                checked,
                groceryToDo?.startDate,
                groceryToDo?.endDate,
                groceryToDo?.completedDate,
              )
            }
          })

          return Promise.all(subTaskPromises)
        } else {

          const parentId = await createTaskNote(
            type,
            responseData?.title,
            responseData?.id,
            AppName.NOTION,
            user.id,
            responseData?.status,
          )

          const subTaskPromises = responseData?.list?.map(async item => {
            const { id, text } = item

            return createTaskNote(
              type,
              text,
              id,
              AppName.NOTION,
              user.id,
              responseData?.status,
              parentId,
            )
          })

          return Promise.all(subTaskPromises)
        }
      }
    })

    await Promise.all(promises)
  } catch (e) {

  }
}

export const updateTaskNote = async (
  type: TableName,
  id: string,
  notes?: string,
  oldDate?: string,
  noteDate?: string,
  status?: selectName,
  oldEvent?: boolean,
  oldCompleted?: boolean,
  oldStartDate?: string,
  oldEndDate?: string,
  oldCompletedDate?: string,
  eventId?: string,
  duration?: number,
) => {
  if (dayjs(oldDate).isAfter(dayjs(noteDate))) {
    return
  }

  try {
    if (!notes) {

      return
    }

    const newDate = dayjs().format()

    return updateTaskInStore(
      type,
      id,
      notes,
      newDate,
      oldEvent,
      oldCompleted,
      oldStartDate,
      oldEndDate,
      oldCompletedDate,
      undefined,
      undefined,
      undefined,
      undefined,
      statusKey[status],
      undefined,
      undefined,
      eventId,
      duration,
    )

  } catch (e) {

  }
}

export const createTaskNote = async (
  type: TableName,
  notes: string,
  syncId: string,
  syncName: string,
  userId: string,
  status: selectName,
  parentId?: string,
) => {
  try {
    if (!notes) {
      return
    }

    const newDate = dayjs().format()

    const taskId = await createTaskInStore(
      userId,
      type,
      notes,
      newDate,
      false,
      false,
      syncId,
      syncName,
      '',
      '',
      statusKey[status],
      parentId,
    )
    return taskId

  } catch (e) {

  }
}

export const queryNotionDB = async (integration: Integration) => {
  try {

    if (!(integration?.id)) {
      return
    }
    const url = `https://api.notion.com/v1/databases/${integration?.resourceId}/query`
    const config = {
      headers: {
        Authorization: `Bearer ${integration?.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2021-08-16',
      },
    }
    const data = {
      sorts: [
        {
          property: 'Last Edited',
          direction: 'descending'
        }
      ]
    }

    const resultData: resultData = await axios.post(url, data, config)

    const responseData: responseData[] = []


    if (resultData?.data?.results[0]?.id) {
      const { data } = resultData





      const { results } = data
      for (let i = 0; i < results.length; i++) {
        const { properties, id: resultId } = results[i]

        const status = properties?.Status?.select?.name
        const title = properties?.Name?.title?.[0]?.plain_text
        const created_time = properties?.['Date Created']?.created_time
        const last_edited_time = properties?.['Date Edited']?.last_edited_time

        const blockUrl = `https://api.notion.com/v1/blocks/${resultId}/children?page_size=100`

        const blockData: blockData = await axios.get(blockUrl, config)

        if (blockData?.data?.results?.[0]?.id) {

          const blockResults = blockData.data.results
          const filteredToDos = blockResults.filter((i: any) => (i.type === 'to_do'))




          if ((filteredToDos.length > 0)) {
            const list: todoResponse[] = filteredToDos.map((i) => {
              const { to_do, id } = i
              const { checked, text } = to_do
              return {
                checked,
                text: text?.[0]?.plain_text,
                id,
              }
            })

            responseData.push({ id: resultId, status, title, list, created_time, last_edited_time })
          } else {
            responseData.push({ id: resultId, status, title, created_time, last_edited_time })
          }

        }
      }

      return responseData
    }
    return

  } catch (e) {





  }
}

export const getIntegrationInfo = async (name: string, tableName: string) => {
  try {
    const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()

    const integrations = await DataStore.query(Integration, c => c.sub('eq', sub)
      .name('eq', name).tableName('eq', tableName))



    if (integrations?.[0]?.id) {
      const [integration] = integrations

      return integration
    }
    return
  } catch (e) {

  }
}
