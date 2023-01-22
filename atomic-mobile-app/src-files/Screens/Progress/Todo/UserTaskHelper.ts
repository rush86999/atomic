import { Dispatch, SetStateAction } from 'react'
import { Auth } from 'aws-amplify'
import { Platform } from 'react-native'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import Toast from 'react-native-toast-message'
import { DataStore } from '@aws-amplify/datastore'
import RNCalendarEvents from 'react-native-calendar-events'
import * as math from 'mathjs'
import { RRule } from 'rrule'

import { ulid } from 'ulid'

import { dayjs, RNLocalize } from '@app/date-utils'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import utc from 'dayjs/plugin/utc'
import Realm from 'realm'
import _ from 'lodash'


import { getRealmApp } from '@realm/realm'

import {
  Task as TaskRealm,
} from '@realm/TaskSchedules'

import {
  updateTaskInStore,
  TableName,
} from '@progress/Todo/IntegrationHelper'

import {
  displayUI,
} from '@progress/Todo/UserTask'



import {
  DailyToDo,
  WeeklyToDo,
  MasterToDo,
  GroceryToDo,
  Status, Point, UserStat,
  ScheduleToDo, Day,
  PrimaryGoalType,
  Frequency,
  ToDoStatus,
} from '@models'

import {
  DailyToDo as DailyToDoRealm, WeeklyToDo as WeeklyToDoRealm, MasterToDo as MasterToDoRealm, GroceryToDo as GroceryToDoRealm,
} from '@realm/UserTask'

import {
  Post as PostRealm,
} from '@realm/Post'

import { Event as LocalEvent, Task as LocalTask } from '@realm/TaskSchedules'

import { Buffer } from '@craftzdog/react-native-buffer'


const realm = getRealmApp()


const bucketRegion = 'us-east-1'
const bucketName = 'atomiclife-app-public-image-prod-uncompressed'

type s3El = React.MutableRefObject<S3Client>

type credIdEl = React.MutableRefObject<string>

type userStatEl = React.MutableRefObject<UserStat>

type userIdEl = React.MutableRefObject<string>

type pointEl = React.MutableRefObject<Point>

type pointRewardEl = React.MutableRefObject<number>

export type CalendarEventIdElType = React.MutableRefObject<string>





type RecurrenceFrequency = 'daily' | 'weekly'
  | 'monthly' | 'yearly'

const recurrenceFrequency = {
  'daily': Frequency.DAILY,
  'weekly': Frequency.WEEKLY,
  'monthly': Frequency.MONTHLY,
  'yearly': Frequency.YEARLY,
}

type dayType = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

type taskType = 'Daily' | 'Weekly' | 'Master' | 'Grocery'


const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

const TODO = 'To Do'
const DOING = 'Doing'
const DONE = 'Done'

export type dragEnd<T> = {
  data: T[]
  from: number
  to: number
}

export const deleteChildrenOfTask = async (
  index: number,
  idArray: string[],
  parentIdArray: string[],
) => {
  try {
    const taskId = idArray[index]
    if (!taskId) {
      // 
      return
    }

    const indexesOfChildren = parentIdArray.map((i, inx) => {

      if (i === taskId) {
        return inx
      }
      return null
    })
      .filter(i => (i !== null))

    const childTaskIds = []

    for (let i = 0; i < indexesOfChildren.length; i++) {
      const childTaskId = idArray[indexesOfChildren[i]]
      childTaskIds.push(childTaskId)
    }



    if (!(childTaskIds?.length > 0)) {
      return
    }

    const promises = childTaskIds.map(async (i, inx) => {
      try {

        // extracted dates
        await deleteExtractedDateCalendarEvent(idArray, inx)
        deleteExtractedDateRealmEvent(idArray, inx)

        // rrule
        await delRruleCalendarEvents(idArray, inx)
        delRruleRealmEvents(idArray, inx)

        // all Calendar events
        const eventObjects = readRealmEventsForTask(i)
        if (eventObjects?.[0]?.id) {
          const events = Array.from(eventObjects)

          if (events?.[0]?.id) {
            const promises = events.map(i => deleteCalendarEvent(i.id))
            await Promise.all(promises)
          }

        }

        // complete removal of events related to taskId
        deleteRealmEventsForTask(i)


      } catch (e) {

      }
    })

    await Promise.all(promises)

    return childTaskIds

  } catch (e) {

  }
}

export const removeParent = async (
  type: TableName,
  index: number,
  parentIdArray: string[],
  setParentIdArray: Dispatch<SetStateAction<string[]>>,
  idArray: string[],
) => {
  try {
    updateDataArray('', parentIdArray, setParentIdArray, index)
    const newDate = dayjs().format()
    const result = await updateTaskInStore(
      type,
      idArray[index],
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      null,
    )


  } catch (e) {

  }
}

export const addParent = async (
  type: TableName,
  index: number,
  indexBefore: number,
  parentIdArray: string[],
  setParentIdArray: Dispatch<SetStateAction<string[]>>,
  idArray: string[],
) => {
  try {
    if ((indexBefore < 0)) {

      return
    }



    const newDate = dayjs().format()


    let taskIdOfBefore = idArray[indexBefore]
    let indexOfBefore = indexBefore
    let parentIdOfBefore = parentIdArray[indexBefore]
    while (
      (parentIdOfBefore?.length > 0)
      && (indexOfBefore > -2)
    ) {
      indexOfBefore--
      taskIdOfBefore = idArray[indexOfBefore]
      parentIdOfBefore = parentIdArray[indexOfBefore]
    }

    if (indexOfBefore < 0) {

      return
    }

    updateDataArray(taskIdOfBefore, parentIdArray, setParentIdArray, index)
    const result = await updateTaskInStore(
      type,
      idArray[index],
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      taskIdOfBefore,
    )



  } catch (e) {

  }
}
export const sortByOrder = <T>(
  a: T[],
  orderArray: number[],
) => {
  const newA = a.map((i, inx) => ({ a: i, order: orderArray[inx] }))

  newA.sort((a, b) => (a.order - b.order))

  const sortedA = newA.map(i => (i.a))
  return sortedA
}

export const onDragEndUpdate = async <T>(
  type: taskType,
  dragEnd: dragEnd<T>,
  idArray: string[],
  notesArray: string[],
  statusArray: ToDoStatus[],
  parentIdArray: string[],
  oldDisplayUIs: string[],
  setDisplayUIs: Dispatch<SetStateAction<string[]>>,
  dataIndexToDisplayArray: number[],
  setDataIndexToDisplayArray: Dispatch<SetStateAction<number[]>>,
  setOrderArray: Dispatch<SetStateAction<number[]>>,
) => {
  try {
    const { data, from, to } = dragEnd
    const tempDisplayUI = reorderDataArray(oldDisplayUIs, from, to)
    const tempDataIndex = reorderDataArray(dataIndexToDisplayArray, from, to)
    setDisplayUIs(tempDisplayUI)
    setDataIndexToDisplayArray(tempDataIndex)

    if (from < 0) {

      return
    }




    // find moved
    const movedValue = oldDisplayUIs[from]



    // check if parent
    const oldDataIndex = dataIndexToDisplayArray[from]

    const taskIdOfMovedValue = idArray[oldDataIndex]

    const isParent = checkTaskIsParent(parentIdArray, taskIdOfMovedValue)

    // first update data arrays
    const { from: fromDataIndex, to: toDataIndex } = getIndexUpdatesFromUI(data as unknown[] as displayUI[], oldDisplayUIs, movedValue)



    let newIdArray = []
    let newNotesArray = []

    let newStatusArray = []
    let newParentIdArray = []

    if (isParent) {

      newIdArray = reorderParentAndChildDataArray(idArray, fromDataIndex, toDataIndex, parentIdArray, taskIdOfMovedValue)
      newNotesArray = reorderParentAndChildDataArray(notesArray, fromDataIndex, toDataIndex, parentIdArray, taskIdOfMovedValue)

      newStatusArray = reorderParentAndChildDataArray(statusArray, fromDataIndex, toDataIndex, parentIdArray, taskIdOfMovedValue)

      newParentIdArray = reorderParentAndChildDataArray(parentIdArray, fromDataIndex, toDataIndex, parentIdArray, taskIdOfMovedValue)


    } else {

      newIdArray = reorderDataArray(idArray, fromDataIndex, toDataIndex)
      newNotesArray = reorderDataArray(notesArray, fromDataIndex, toDataIndex)


      newStatusArray = reorderDataArray(statusArray, fromDataIndex, toDataIndex)
      newParentIdArray = reorderDataArray(parentIdArray, fromDataIndex, toDataIndex)

    }

    // if child check if parent removed
    if (parentIdArray?.[fromDataIndex]) {

      const parentRemoved = checkIfParentRemovedOfChildMoved(
        newParentIdArray,
        parentIdArray?.[fromDataIndex],
        newIdArray,
        movedValue,
        newNotesArray,
      )



      if (parentRemoved) {

        // remove from db
        newParentIdArray = await updateParentIdTaskInStore(
          toDataIndex,
          null,
          taskIdOfMovedValue,
          newParentIdArray,
          type
        )


      }
    }

    // check if status changed
    const newStatus = checkStatusChange(
      data as unknown[] as displayUI[],
      movedValue,
    )



    // update status
    if (newStatus?.value !== statusArray?.[fromDataIndex]) {
      newStatusArray = await updateStatusTaskInStore(
        toDataIndex,
        newStatus?.value || ToDoStatus.TODO,
        taskIdOfMovedValue,
        newStatusArray,
        type,
        isParent,
        newParentIdArray,
        newIdArray,
      )


    }




    const newDate = dayjs().format()
    // update order in db
    const promises = newIdArray.map(async (id, index) => {
      try {
        return updateTaskInStore(
          type as TableName,
          id,
          undefined,
          newDate,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          index,
        )

      } catch (e) {

      }
    })

    await Promise.all(promises)

    setOrderArray(newNotesArray.map((_, inx) => inx))
    const {
      displayUIArray: newDisplayUIArray,
      dataIndexToDisplayArray: newDataIndexToDisplayArray,
    } = getDisplayUI(newNotesArray, newStatusArray)


    setDataIndexToDisplayArray(newDataIndexToDisplayArray)
    setDisplayUIs(newDisplayUIArray)
  } catch (e) {

  }
}

export const checkTaskIsParent = (
  parentIdArray: string[],
  taskId: string
) => {
  const found = parentIdArray.find(i => (i === taskId))
  return !!found
}


export const checkIfParentRemovedOfChildMoved = (
  newParentIdArray: string[],
  oldParentId: string,
  newIdArray: string[],
  movedValue: string,
  newNotesArray: string[],
) => {

  const movedIndex = newNotesArray.indexOf(movedValue)


  if (movedIndex === -1) {

    return
  }

  const newOneBeforeParentId = newParentIdArray[movedIndex - 1]


  if (newOneBeforeParentId === oldParentId) {
    return false
  }

  const newOneBeforeTaskId = newIdArray[movedIndex - 1]


  if (newOneBeforeTaskId === oldParentId) {
    return false
  }

  return true
}

export const findParentOfTask = (
  displayUIs: displayUI[],
  indexOfChild: number,
) => {
  // validate values
  if (indexOfChild === 0) {

    return
  }

  if (indexOfChild === 1) {

    return
  }

  if (indexOfChild > displayUIs.length - 1) {

    return
  }

  const parentValue = displayUIs[indexOfChild - 1]

  const found = [TODO, DOING, DONE].find(i => (i === parentValue))

  if (found) {

    return
  }

  return parentValue
}

export const checkStatusChange = (
  reorderedDisplayUIs: displayUI[],
  valueMoved: string,
) => {
  const reversed = _.reverse(reorderedDisplayUIs)



  const index = reversed.indexOf(valueMoved)

  const sliced = reversed.slice(index)

  const headerArray = [TODO, DOING, DONE]

  for (let i = 0; i < sliced.length; i++) {
    const found = headerArray.find(j => (j === sliced[i]))

    if (found) {
      if (found === TODO) {
        return {
          label: TODO,
          value: ToDoStatus.TODO,
        }
      } else if (found === DOING) {
        return {
          label: DOING,
          value: ToDoStatus.DOING,
        }
      } else if (found === DONE) {
        return {
          label: DONE,
          value: ToDoStatus.DONE,
        }
      }
    }
  }
}

export const reorderDataArray = <T>(
  a: T[],
  from: number,
  to: number,
) => {
  const backwards = to < from
  const same = to === from
  const movedValue = a[from]
  const newA: T[] = []

  for (let i = 0; i < a.length; i++) {
    if (i === to) {
      if (backwards) {
        newA.push(movedValue)
        newA.push(a[i])
        continue
      } else if (same) {
        newA.push(a[i])
        continue
      } else {
        newA.push(a[i])
        newA.push(movedValue)
        continue
      }

    }

    if (i !== from) {
      newA.push(a[i])
    }
  }

  return newA
}

export const reorderParentAndChildDataArray = <T>(
  a: T[],
  from: number,
  to: number,
  oldParentIdArray: string[],
  taskIdOfMovedValue: string,
) => {

  const backwards = to < from

  const movedValue = a[from]
  const newA: T[] = []

  let same: boolean = true


  if (!backwards) {


    for (let i = (from + 1); i <= to; i++) {
      if (taskIdOfMovedValue !== oldParentIdArray[i]) {

        same = false
      }

    }
  }

  // moving around children only and diff status
  if (same) {
    return a
  }

  same = to === from


  const childTaskIdIndexes = oldParentIdArray.map((i, index) => {
    if (i === taskIdOfMovedValue) {
      return index
    }
    return null
  })
    .filter(i => (i !== null))



  for (let i = 0; i < a.length; i++) {

    if (i === to) {
      if (backwards) {
        newA.push(movedValue)

        for (let j = 0; j < childTaskIdIndexes.length; j++) {
          const oldIndex = childTaskIdIndexes[j]

          if (to === oldIndex) {
            continue
          }

          if (from === oldIndex) {
            continue
          }
          newA.push(a[oldIndex])
        }

        newA.push(a[i])
        continue
      } else if (same) {
        newA.push(a[i])
        for (let j = 0; j < childTaskIdIndexes.length; j++) {
          const oldIndex = childTaskIdIndexes[j]
          if (to === oldIndex) {
            continue
          }

          if (from === oldIndex) {
            continue
          }
          newA.push(a[oldIndex])
        }
        continue
      } else {
        newA.push(a[i])
        newA.push(movedValue)
        for (let j = 0; j < childTaskIdIndexes.length; j++) {
          const oldIndex = childTaskIdIndexes[j]
          if (to === oldIndex) {
            continue
          }

          if (from === oldIndex) {
            continue
          }
          newA.push(a[oldIndex])
        }
        continue
      }
    }

    if (childTaskIdIndexes.includes(i)) {
      continue
    }


    if (i === from) {
      continue
    }



    if (i !== from) {
      newA.push(a[i])
    }


  }

  return newA
}

export const updateDataToDisplayUI = <T>(
  data: T[],
  setData: Dispatch<SetStateAction<T[]>>,
  dataIndexToDisplayArray: number[],
) => {
  // reorder data indices to displayUI order
  const newData: T[] = []

  for (let i = 0; i < dataIndexToDisplayArray.length; i++) {
    const oldIndex = dataIndexToDisplayArray[i]
    if (oldIndex > -1) {
      newData.push(data[oldIndex])
    }
  }
  setData(newData)
}

export const sortByStatus = <T>(
  aArray: T[],
  statusArray: ToDoStatus[],
) => {

  const toDoArray: T[] = []
  const doingArray: T[] = []
  const doneArray: T[] = []

  aArray.forEach((a, index) => {

    const status = statusArray[index]

    if ((status === ToDoStatus.TODO)
      || !status) {
      toDoArray.push(a)

    } else if (status === ToDoStatus.DOING) {

      doingArray.push(a)
    } else if (status === ToDoStatus.DONE) {

      doneArray.push(a)
    }
  })

  const newArray: T[] = toDoArray.concat(doingArray).concat(doneArray)

  return newArray
}

export const getDisplayUI = (
  notesArray: string[],
  statusArray: ToDoStatus[],
) => {

  const sortedOrder: ToDoStatus[] = []
  const toDoArray: string[] = []
  const doingArray: string[] = []
  const doneArray: string[] = []

  const indexToDoWithStatusArray: number[] = []
  const indexDoingWithStatusArray: number[] = []
  const indexDoneWithStatusArray: number[] = []

  notesArray.forEach((note, index) => {

    const status = statusArray[index]

    if ((status === ToDoStatus.TODO)
      || !status) {
      const found = sortedOrder.find(i => (i === ToDoStatus.TODO))
      if (!found) {
        sortedOrder.push(ToDoStatus.TODO)
        toDoArray.push('To Do')
        toDoArray.push(note)
        indexToDoWithStatusArray.push(-1)
        indexToDoWithStatusArray.push(index)
      } else {
        toDoArray.push(note)
        indexToDoWithStatusArray.push(index)
      }
    } else if (status === ToDoStatus.DOING) {
      const found = sortedOrder.find(i => (i === ToDoStatus.DOING))

      if (!found) {
        sortedOrder.push(ToDoStatus.DOING)
        doingArray.push('Doing')
        doingArray.push(note)
        indexDoingWithStatusArray.push(-1)
        indexDoingWithStatusArray.push(index)
      } else {
        doingArray.push(note)
        indexDoingWithStatusArray.push(index)
      }
    } else if (status === ToDoStatus.DONE) {

      const found = sortedOrder.find(i => (i === ToDoStatus.DONE))

      if (!found) {

        sortedOrder.push(ToDoStatus.DONE)
        doneArray.push('Done')
        doneArray.push(note)
        indexDoneWithStatusArray.push(-1)
        indexDoneWithStatusArray.push(index)
      } else {
        doneArray.push(note)
        indexDoneWithStatusArray.push(index)
      }
    }
  })

  if (
    (toDoArray?.length > 0)
    && !(doingArray?.length > 0)
    && !(doneArray?.length > 0)
  ) {
    const newArray: displayUI[] = toDoArray.concat(['Doing']).concat(['Done'])
    const newIndexArray: number[] = indexToDoWithStatusArray.concat([-1]).concat([-1])
    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    (toDoArray?.length > 0)
    && !(doingArray?.length > 0)
    && (doneArray?.length > 0)
  ) {

    const newArray: displayUI[] = toDoArray.concat(['Doing']).concat(doneArray)
    const newIndexArray: number[] = indexToDoWithStatusArray.concat([-1]).concat(indexDoneWithStatusArray)

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    (toDoArray?.length > 0)
    && (doingArray?.length > 0)
    && !(doneArray?.length > 0)
  ) {

    const newArray: displayUI[] = toDoArray.concat(doingArray).concat(['Done'])
    const newIndexArray: number[] = indexToDoWithStatusArray.concat(indexDoingWithStatusArray).concat([-1])

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    !(toDoArray?.length > 0)
    && (doingArray?.length > 0)
    && !(doneArray?.length > 0)
  ) {
    const newArray: displayUI[] = (['To Do']).concat(doingArray).concat(['Done'])
    const newIndexArray: number[] = ([-1]).concat(indexDoingWithStatusArray).concat([-1])

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    !(toDoArray?.length > 0)
    && !(doingArray?.length > 0)
    && (doneArray?.length > 0)
  ) {
    const newArray: displayUI[] = (['To Do']).concat(['Doing']).concat(doneArray)
    const newIndexArray: number[] = ([-1]).concat([-1]).concat(indexDoneWithStatusArray)

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    !(toDoArray?.length > 0)
    && (doingArray?.length > 0)
    && (doneArray?.length > 0)
  ) {
    const newArray: displayUI[] = (['To Do']).concat(doingArray).concat(doneArray)
    const newIndexArray: number[] = ([-1]).concat(indexDoingWithStatusArray).concat(indexDoneWithStatusArray)

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  } else if (
    !(toDoArray?.length > 0)
    && !(doingArray?.length > 0)
    && !(doneArray?.length > 0)
  ) {
    const newArray: displayUI[] = (['To Do']).concat(['Doing']).concat(['Done'])
    const newIndexArray: number[] = ([-1]).concat([-1]).concat([-1])

    return {
      displayUIArray: newArray,
      dataIndexToDisplayArray: newIndexArray,
    }
  }

  const newArray: displayUI[] = toDoArray.concat(doingArray).concat(doneArray)
  const newIndexArray: number[] = indexToDoWithStatusArray.concat(indexDoingWithStatusArray).concat(indexDoneWithStatusArray)

  return {
    displayUIArray: newArray,
    dataIndexToDisplayArray: newIndexArray,
  }
}

export const getIndexUpdatesFromUI = (
  reorderedDisplayUIs: displayUI[],
  oldDisplayUIs: displayUI[],
  valueMoved: string,
): { from: number, to: number } => {

  const filteredReorderedDisplayUIs = reorderedDisplayUIs.filter(i => (i !== TODO))
    .filter(i => (i !== DOING))
    .filter(i => (i !== DONE))

  const filteredOldDisplayUIs = oldDisplayUIs.filter(i => (i !== TODO))
    .filter(i => (i !== DOING))
    .filter(i => (i !== DONE))

  const from = filteredOldDisplayUIs.indexOf(valueMoved)
  const to = filteredReorderedDisplayUIs.indexOf(valueMoved)

  return { from, to }
}

export const updateStatusTask = async (
  index: number,
  status: ToDoStatus,
  taskId: string,
  statusArray: ToDoStatus[],
  setStatusArray: Dispatch<SetStateAction<ToDoStatus[]>>,
  type: taskType,
) => {
  try {
    if ((typeof index !== 'number')
      || !status
      || !taskId
      || !type) {
      return
    }

    const newDate = dayjs().format()

    await updateTaskInStore(
      type as TableName,
      taskId,
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      status,
      undefined,
      undefined,
    )

    const newStatusArray = statusArray
      .slice(0, index)
      .concat([status])
      .concat(statusArray.slice(index + 1))

    setStatusArray(newStatusArray)

  } catch (e) {

  }
}

export const updateStatusTaskInStore = async (
  index: number,
  status: ToDoStatus,
  taskId: string,
  statusArray: ToDoStatus[],
  type: taskType,
  isParent?: boolean,
  parentIdArray?: string[],
  idArray?: string[],
) => {
  try {
    if ((typeof index !== 'number')
      || !status
      || !taskId
      || !type) {
      return
    }


    const newDate = dayjs().format()

    await updateTaskInStore(
      type as TableName,
      taskId,
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      status,
      undefined,
      undefined,
    )

    let newStatusArray = statusArray
      .slice(0, index)
      .concat([status])
      .concat(statusArray.slice(index + 1))


    if (isParent) {
      const childTaskIdIndexes = parentIdArray.map((i, inx) => {
        if (i === taskId) {
          return inx
        }
        return null
      })
        .filter(i => (i !== null))


      const childTaskIds = childTaskIdIndexes.map((i) => {
        return idArray[i]
      })

      const promises = childTaskIds.map(async (i) => updateTaskInStore(
        type as TableName,
        i,
        undefined,
        newDate,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        status,
        undefined,
        undefined,
      ))

      await Promise.all(promises)

      for (let i = 0; i < childTaskIdIndexes.length; i++) {
        newStatusArray = newStatusArray
          .slice(0, childTaskIdIndexes[i])
          .concat([status])
          .concat(newStatusArray.slice(childTaskIdIndexes[i] + 1))
      }
    }

    return newStatusArray

  } catch (e) {

  }
}

export const updateParentIdTask = async (
  index: number,
  parentId: string,
  taskId: string,
  parentIdArray: string[],
  setParentIdArray: Dispatch<SetStateAction<string[]>>,
  type: taskType,
) => {
  try {
    if ((typeof index !== 'number')
      || !parentId
      || !taskId
      || !type) {
      return
    }

    const newDate = dayjs().format()

    await updateTaskInStore(
      type as TableName,
      taskId,
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      parentId,
      undefined,
    )

    const newParentIdArray = parentIdArray
      .slice(0, index)
      .concat([parentId])
      .concat(parentIdArray.slice(index + 1))

    setParentIdArray(newParentIdArray)


  } catch (e) {

  }
}

export const updateParentIdTaskInStore = async (
  index: number,
  parentId: string | null,
  taskId: string,
  parentIdArray: string[],
  type: taskType,
) => {
  try {
    if ((typeof index !== 'number')
      || !taskId
      || !type) {
      return
    }

    const newDate = dayjs().format()

    await updateTaskInStore(
      type as TableName,
      taskId,
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      parentId,
      undefined,
    )



    const newParentIdArray = parentIdArray
      .slice(0, index)
      .concat([parentId])
      .concat(parentIdArray.slice(index + 1))



    return newParentIdArray


  } catch (e) {

  }
}

export const updateOrderTask = async (
  index: number,
  order: number,
  taskId: string,
  orderArray: number[],
  setOrderArray: Dispatch<SetStateAction<number[]>>,
  type: taskType,
) => {
  try {
    if ((typeof index !== 'number')
      || !order
      || !taskId
      || !type) {
      return
    }

    const newDate = dayjs().format()

    await updateTaskInStore(
      type as TableName,
      taskId,
      undefined,
      newDate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      order,
    )

    const newOrderArray = orderArray
      .slice(0, index)
      .concat([order])
      .concat(orderArray.slice(index + 1))

    setOrderArray(newOrderArray)


  } catch (e) {

  }
}

export const addToDataArrayAfterIndex = <T>(
  a: T,
  aArray: T[],
  isInitial: boolean,
  setaArray: Dispatch<SetStateAction<T[]>>,
  index?: number,
) => {

  if (!isInitial) {
    if (typeof index !== 'number') {

      return
    }
    const newaArray = aArray.slice(0, index + 1)
      .concat([a])
      .concat(aArray.slice(index + 1))

    setaArray(newaArray)
    return newaArray
  }

  setaArray([a])
  return [a]
}

export const addToOrderArrayAfterIndexWithNewOrder = (
  orderArray: number[],
  isInitial: boolean,
  setOrderArray: Dispatch<SetStateAction<number[]>>,
  index?: number,
) => {
  if (!isInitial) {
    if (typeof index !== 'number') {

      return
    }

    const subOrderArray = orderArray.slice(0, index + 1)
    const secondSubOrderArray = orderArray.slice(index + 1)

    for (let i = 0; i < secondSubOrderArray.length; i++) {
      secondSubOrderArray[i] += 1
    }

    const newOrderArray = subOrderArray
      .concat([subOrderArray.length])
      .concat(secondSubOrderArray)

    setOrderArray(newOrderArray)
    return newOrderArray
  }

  setOrderArray([0])
  return [0]
}

export const updateDataArray = <T>(
  t: T,
  tArray: T[],
  setTArray: Dispatch<SetStateAction<T[]>>,
  index: number,
) => {

  const newTArray = tArray.slice(0, index).concat([t]).concat(tArray.slice(index + 1))

  setTArray(newTArray)
  return newTArray
}

export const removeFromDataArray = <T>(
  index: number,
  dataArray: T[],
  setDataArray: Dispatch<SetStateAction<T[]>>,
) => {
  const newDataArray = [
    ...dataArray.slice(0, index),
    ...dataArray.slice(index + 1)
  ]

  setDataArray(newDataArray)
  return newDataArray
}
// export const closeRealm = () => // realm.close()
export const addToStatusArray = (value: ToDoStatus, isInitial: boolean, statusArray: ToDoStatus[], setStatusArray: Dispatch<SetStateAction<ToDoStatus[]>>) => {
  if (!isInitial) {
    const newStatusArray = [
      ...statusArray,
      value
    ]

    return setStatusArray(newStatusArray)
  }

  return setStatusArray([value])
}

export const addToParentIdArray = (value: string, isInitial: boolean, parentIdArray: string[], setParentIdArray: Dispatch<SetStateAction<string[]>>) => {
  if (!isInitial) {
    const newParentIdArray = [
      ...parentIdArray,
      value
    ]

    return setParentIdArray(newParentIdArray)
  }

  return setParentIdArray([value])
}

export const addToDisplayUIArray = (value: string, isInitial: boolean, displayUIArray: string[], setDisplayUIArray: Dispatch<SetStateAction<string[]>>) => {
  if (!isInitial) {
    const newDisplayUIArray = [
      ...displayUIArray,
      value
    ]

    return setDisplayUIArray(newDisplayUIArray)
  }

  return setDisplayUIArray([value])
}

export const addToDataIndexToDisplayArray = (value: string, isInitial: boolean, dataIndexToDisplayArray: string[], setDataIndexToDisplayArray: Dispatch<SetStateAction<string[]>>) => {
  if (!isInitial) {
    const newDataIndexToDisplayArray = [
      ...dataIndexToDisplayArray,
      value
    ]

    return setDataIndexToDisplayArray(newDataIndexToDisplayArray)
  }

  return setDataIndexToDisplayArray([value])
}

export const addToOrderArray = (value: string, isInitial: boolean, orderArray: string[], setOrderArray: Dispatch<SetStateAction<string[]>>) => {
  if (!isInitial) {
    const newOrderArray = [
      ...orderArray,
      value
    ]

    return setOrderArray(newOrderArray)
  }

  return setOrderArray([value])
}

export const sortTasksByParent = (
  parentIdArray: string[],
  idArray: string[],
  notesArray: string[],
  completedArray: boolean[],
  startDateArray: string[],
  endDateArray: string[],
  nextDayArray: boolean[],
  completedDateArray: string[],
  importantArray: boolean[],
  dateArray: string[],
  eventArray: boolean[],
  scheduleIdArray: string[],
  softDeadlineArray: string[],
  hardDeadlineArray: string[],
  statusArray: ToDoStatus[],
  eventIdArray: string[],
  durationArray: number[],
) => {

  let doneSortedIdArray: string[] = []

  let sortedIdArray: string[] = []
  let sortedNotesArray: string[] = []
  let sortedCompletedArray: boolean[] = []
  let sortedStartDateArray: string[] = []
  let sortedEndDateArray: string[] = []
  let sortedNextDayArray: boolean[] = []
  let sortedCompletedDateArray: string[] = []
  let sortedImportantArray: boolean[] = []
  let sortedDateArray: string[] = []
  let sortedEventArray: boolean[] = []
  let sortedScheduleIdArray: string[] = []
  let sortedSoftDeadlineArray: string[] = []
  let sortedHardDeadlineArray: string[] = []

  let sortedStatusArray: ToDoStatus[] = []
  let sortedParentIdArray: string[] = []
  let sortedEventIdArray: string[] = []
  let sortedDurationArray: number[] = []

  for (let i = 0; i < idArray.length; i++) {
    const value = doneSortedIdArray.find(u => (u === idArray[i]))

    if (!value) {
      sortedIdArray.push(idArray[i])
      doneSortedIdArray.push(idArray[i])

      sortedNotesArray.push(notesArray[i])
      sortedCompletedArray.push(completedArray[i])
      sortedStartDateArray.push(startDateArray[i])
      sortedEndDateArray.push(endDateArray[i])
      sortedNextDayArray.push(nextDayArray[i])
      sortedCompletedDateArray.push(completedDateArray[i])
      sortedImportantArray.push(importantArray[i])
      sortedDateArray.push(dateArray[i])
      sortedEventArray.push(eventArray[i])
      sortedScheduleIdArray.push(scheduleIdArray[i])
      sortedSoftDeadlineArray.push(softDeadlineArray[i])
      sortedHardDeadlineArray.push(hardDeadlineArray[i])

      sortedStatusArray.push(statusArray[i])
      sortedParentIdArray.push(parentIdArray[i])
      sortedEventIdArray.push(eventIdArray[i])
      sortedDurationArray.push(durationArray[i])

      for (let j = 0; j < idArray.length; j++) {

        if (idArray[i] === parentIdArray[j]) {
          sortedIdArray.push(idArray[j])
          doneSortedIdArray.push(idArray[j])

          sortedNotesArray.push(notesArray[j])
          sortedCompletedArray.push(completedArray[j])
          sortedStartDateArray.push(startDateArray[j])
          sortedEndDateArray.push(endDateArray[j])
          sortedNextDayArray.push(nextDayArray[j])
          sortedCompletedDateArray.push(completedDateArray[j])
          sortedImportantArray.push(importantArray[j])
          sortedDateArray.push(dateArray[j])
          sortedEventArray.push(eventArray[j])
          sortedScheduleIdArray.push(scheduleIdArray[j])
          sortedSoftDeadlineArray.push(softDeadlineArray[j])
          sortedHardDeadlineArray.push(hardDeadlineArray[j])

          sortedStatusArray.push(statusArray[j])
          sortedParentIdArray.push(parentIdArray[j])
          sortedEventIdArray.push(eventIdArray[j])
          sortedDurationArray.push(durationArray[j])
        }
      }
    }
  }

  return {
    sortedParentIdArray,
    sortedIdArray,
    sortedNotesArray,
    sortedCompletedArray,
    sortedStartDateArray,
    sortedEndDateArray,
    sortedNextDayArray,
    sortedCompletedDateArray,
    sortedImportantArray,
    sortedDateArray,
    sortedEventArray,
    sortedScheduleIdArray,
    sortedSoftDeadlineArray,
    sortedHardDeadlineArray,
    sortedStatusArray,
    sortedEventIdArray,
    sortedDurationArray,
  }
}

export const updateStatusArray = (value: ToDoStatus, index: number, statusArray: ToDoStatus[], setStatusArray: Dispatch<SetStateAction<ToDoStatus[]>>) => {
  const newStatusArray = [
    ...statusArray.slice(0, index),
    value,
    ...statusArray.slice(index + 1),
  ]

  setStatusArray(newStatusArray)
}

export const updateParentIdArray = (value: string, index: number, parentIdArray: string[], setParentIdArray: Dispatch<SetStateAction<string[]>>) => {
  const newParentIdArray = [
    ...parentIdArray.slice(0, index),
    value,
    ...parentIdArray.slice(index + 1),
  ]

  setParentIdArray(newParentIdArray)
}

export const updateDisplayUIArray = (value: string, index: number, displayUIArray: string[], setDisplayUIArray: Dispatch<SetStateAction<string[]>>) => {
  const newDisplayUIArray = [
    ...displayUIArray.slice(0, index),
    value,
    ...displayUIArray.slice(index + 1),
  ]

  setDisplayUIArray(newDisplayUIArray)
}

export const updateDataIndexToDisplayArray = (value: string, index: number, dataIndexToDisplayArray: string[], setDataIndexToDisplayArray: Dispatch<SetStateAction<string[]>>) => {
  const newDataIndexToDisplayArray = [
    ...dataIndexToDisplayArray.slice(0, index),
    value,
    ...dataIndexToDisplayArray.slice(index + 1),
  ]

  setDataIndexToDisplayArray(newDataIndexToDisplayArray)
}

export const updateOrderArray = (value: string, index: number, orderArray: string[], setOrderArray: Dispatch<SetStateAction<string[]>>) => {
  const newOrderArray = [
    ...orderArray.slice(0, index),
    value,
    ...orderArray.slice(index + 1),
  ]

  setOrderArray(newOrderArray)
}

export const removeFromStatusArray = (index: number, statusArray: ToDoStatus[], setStatusArray: Dispatch<SetStateAction<ToDoStatus[]>>) => {
  const newStatusArray = [
    ...statusArray.slice(0, index),
    ...statusArray.slice(index + 1)
  ]

  setStatusArray(newStatusArray)
}

export const removeFromParentIdArray = (index: number, parentIdArray: string[], setParentIdArray: Dispatch<SetStateAction<string[]>>) => {
  const newParentIdArray = [
    ...parentIdArray.slice(0, index),
    ...parentIdArray.slice(index + 1)
  ]

  setParentIdArray(newParentIdArray)
}


export const removeFromDisplayUIArray = (index: number, displayUIArray: string[], setDisplayUIArray: Dispatch<SetStateAction<string[]>>) => {
  const newDisplayUIArray = [
    ...displayUIArray.slice(0, index),
    ...displayUIArray.slice(index + 1)
  ]

  setDisplayUIArray(newDisplayUIArray)
}

export const removeFromDataIndexToDisplayArray = (index: number, dataIndexToDisplayArray: string[], setDataIndexToDisplayArray: Dispatch<SetStateAction<string[]>>) => {
  const newDataIndexToDisplayArray = [
    ...dataIndexToDisplayArray.slice(0, index),
    ...dataIndexToDisplayArray.slice(index + 1)
  ]

  setDataIndexToDisplayArray(newDataIndexToDisplayArray)
}

export const removeFromOrderArray = (index: number, orderArray: string[], setOrderArray: Dispatch<SetStateAction<string[]>>) => {
  const newOrderArray = [
    ...orderArray.slice(0, index),
    ...orderArray.slice(index + 1)
  ]

  setOrderArray(newOrderArray)
}

export const getS3AndCredId = async (s3El: s3El, credIdEl: credIdEl) => {
  try {
    const credentials = await Auth.currentCredentials();
    const newS3 = new S3Client({
      region: bucketRegion,
      credentials: Auth.essentialCredentials(credentials),
      // signatureVersion: 'v4', only used for kms encryption
      //  apiVersion: '2006-03-01',
      // params: { Bucket: bucketName },
    });
    // setS3(newS3)
    s3El.current = newS3
    // setCredId(credentials.identityId)
    credIdEl.current = credentials.identityId
  } catch (e) {
    // 
    Toast.show({
      type: 'error',
      text1: 'Oops...something went wrong',
      text2: 'Something went wrong getting file',
    })
  }
};

export const getToDoType = (type: taskType) => {
  switch (type) {
    case 'Daily':
      return DailyToDo
    case 'Weekly':
      return WeeklyToDo
    case 'Master':
      return MasterToDo
    case 'Grocery':
      return GroceryToDo
  }
}

export const updateUserStats = async (
  userStatEl: userStatEl,
  taskCompletedCount: number,
  userIdEl: userIdEl,
) => {
  if (!userStatEl?.current
    || !(typeof taskCompletedCount === 'number')
    || !(userIdEl?.current)) {
    // 
    return
  }

  try {
    if (userStatEl?.current?.currentDate) {
      // 
      /** no data was added for today so create new item */
      if (dayjs(userStatEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
        const newUserStat = await DataStore.save(
          UserStat.copyOf(userStatEl?.current, updated => {

            /** update max min based on previous values */
            if ((userStatEl?.current?.max || 0) < (userStatEl?.current.currentValue || 0)) {
              updated.max = userStatEl?.current.currentValue || 0
              updated.maxDate = userStatEl?.current.currentDate || dayjs().format()

            }

            if ((userStatEl?.current?.min || 0) > (userStatEl?.current.currentValue || 0)) {
              updated.min = userStatEl?.current.currentValue || 0
              updated.minDate = userStatEl?.current.currentDate || dayjs().format()
            }

            // currentValue is the value of past and calculate based off of this
            const newValue = math.chain(userStatEl?.current?.value || 0).add(userStatEl?.current?.currentValue || 0).done()

            // set currentdate as it is yesterday's date or not set
            updated.currentDate = dayjs().format()
            // set currentValue to today's value
            updated.currentValue = taskCompletedCount

            updated.value = newValue

            const newDayCount = math.chain(userStatEl?.current?.dayCount || 0).add(1).done()
            updated.dayCount = newDayCount
          })
        )
        // setUserStat(newUserStat)
        userStatEl.current = newUserStat
      } else {
        const newUserStat = await DataStore.save(
          UserStat.copyOf(userStatEl?.current, updated => {

            updated.value = taskCompletedCount
          })
        )
        // setUserStat(newUserStat)
        userStatEl.current = newUserStat
      }
    } else if (!(userStatEl?.current?.currentDate)) {
      // first time UserStat
      const newUserStat = new UserStat({
        primaryGoalType: PrimaryGoalType.TODO,
        userId: userIdEl?.current,
        value: taskCompletedCount,
        max: taskCompletedCount,
        min: taskCompletedCount,
        maxDate: dayjs().format(),
        minDate: dayjs().format(),
        currentDate: dayjs().format(),
        dayCount: 1,
      })

      await DataStore.save(newUserStat)
      userStatEl.current = newUserStat
    }
  } catch (e) {
    // 
  }
}

export const updateUserPoint = async (
  pointEl: pointEl,
  taskCompletedCount: number,
  pointRewardEl: pointRewardEl,
) => {
  try {
    if (pointEl?.current?.currentDate) {
      /** update based previous date data instead of today's */
      if (dayjs(pointEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
        await DataStore.save(
          Point.copyOf(
            pointEl?.current, updated => {
              /** update max min based on previous values */
              if ((pointEl?.current?.max || 0) < (pointEl?.current?.currentPoints || 0)) {
                updated.max = pointEl?.current?.currentPoints || 0
                updated.maxDate = pointEl?.current.currentDate || dayjs().format()

              }

              if ((pointEl?.current?.min || 0) > (pointEl?.current.currentPoints || 0)) {
                updated.min = pointEl?.current.currentPoints || 0
                updated.minDate = pointEl?.current.currentDate || dayjs().format()
              }


              // currentValue is the value of past and calculate based off of this
              const newValue = math.chain(pointEl?.current?.points).add(pointEl?.current?.currentPoints || 0).done()

              // set currentdate as it is yesterday's date or not set
              updated.currentDate = dayjs().format()
              // set currentValue to today's value
              // include point reward
              updated.currentPoints = math.chain(taskCompletedCount).multiply(pointRewardEl?.current ?? 1).done()

              updated.points = newValue

              const newDayCount = math.chain(pointEl?.current?.dayCount).add(1).done()
              updated.dayCount = newDayCount
            }
          )
        )

      }
    } else {
      // point does not exist
      //  this should be created when user registers
      // 
    }
  } catch (e) {
    // 
  }
}

export const _createDailyTaskToStore = async (
  userIdEl: userIdEl,
  text: string,
  completed?: boolean,
  startDate?: string,
  endDate?: string,
  completedDate?: string,
  nextDay?: boolean,
  important?: boolean,
  softDeadline?: string,
  hardDeadline?: string,
  status?: ToDoStatus,
  parentId?: string,
  order?: number,
  eventId?: string,
  duration?: number,
) => {
  try {

    const newDailyToDo = await DataStore.save(
      new DailyToDo({
        userId: userIdEl?.current,
        notes: text,
        completed: completed || false,
        nextDay: nextDay || false,
        important: important || false,
        event: false,
        softDeadline: softDeadline || '',
        hardDeadline: hardDeadline || '',
        date: dayjs().format(),
        startDate,
        endDate,
        completedDate,
        status,
        parentId,
        order,
        eventId,
        duration,
      })
    )



    return newDailyToDo

  } catch (e) {
    // 
  }
}

export const _createWeeklyTaskToStore = async (
  userIdEl: userIdEl,
  text: string,
  completed?: boolean,
  startDate?: string,
  endDate?: string,
  completedDate?: string,
  nextDay?: boolean,
  important?: boolean,
  softDeadline?: string,
  hardDeadline?: string,
  status?: ToDoStatus,
  parentId?: string,
  order?: number,
  eventId?: string,
  duration?: number,
) => {
  try {

    const newWeeklyToDo = await DataStore.save(
      new WeeklyToDo({
        userId: userIdEl?.current,
        notes: text,
        completed: completed || false,
        nextDay: nextDay || false,
        important: important || false,
        event: false,
        softDeadline: softDeadline || '',
        hardDeadline: hardDeadline || '',
        date: dayjs().format(),
        startDate,
        endDate,
        completedDate,
        status,
        parentId,
        order,
        eventId,
        duration,
      })
    )



    return newWeeklyToDo

  } catch (e) {
    // 
  }
}

export const createRealmTaskForEvent = (
  // index: number,
  // idArray: string[],
  taskId: string,
) => {
  if (!taskId) {

    Toast.show({
      type: 'error',
      text1: `Missing info`,
      text2: `The task item does not seem to exist`
    })
    return

  }
  // let task: Realm.Object | undefined
  // const taskId = idArray[index]
  if (taskId) {
    // valide before creating realm task for event
    const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

    // 

    if (!task?.id) {
      realm.write(() => {
        realm.create('Task', {
          id: taskId,
        })
      })
    }
  }
}

export const createRealmEvent = (
  eventId: string,
  startDate: string,
  endDate: string,
  taskId: string,
  calendarId: string,
  primaryGoalType: string,
  recurringRandom: boolean,
  rruleEvent: boolean,
  deadline: boolean,
  event: boolean,
  recurringStartDate?: string,
  recurringEndDate?: string,
  title?: string,
  notes?: string,
  extractedStartDate?: string,
  extractedEndDate?: string,
  secondaryGoalType?: string,
) => {

  // 

  if (
    !eventId
    || !startDate
  ) {

    Toast.show({
      type: 'error',
      text1: `Missing info`,
      text2: `The event item to save is missing information`
    })
    return

  }

  let eventTask: LocalEvent
  realm.write(() => {
    eventTask = realm.create('Event', {
      id: eventId,
      calendarId,
      primaryGoalType,
      title,
      startDate: dayjs(startDate).toDate(),
      endDate: dayjs(endDate).isValid() ? dayjs(endDate).toDate() : dayjs(startDate).toDate(),
      recurringRandom,
      rruleEvent,
      deadline,
      event,
      recurringStartDate: recurringStartDate ? dayjs(recurringStartDate).toDate() : undefined,
      recurringEndDate: recurringEndDate ? dayjs(recurringEndDate).toDate() : undefined,
      extractedStartDate: extractedStartDate ? dayjs(extractedStartDate).toDate() : undefined,
      extractedEndDate: extractedEndDate ? dayjs(extractedEndDate).toDate() : undefined,
      notes,
      secondaryGoalType,
    })



    if (taskId) {
      // append to task
      const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

      // 

      if (task?.events) {
        task.events.push(eventTask)
      } else {
        if (!(task?.id)) {
          realm.create('Task', {
            id: taskId,
            events: [eventTask]
          })
        }
      }
    }
  })
}

export const readRealmEventsForTask = (
  taskId: string,
  recurringRandom?: boolean,
  rruleEvent?: boolean,
  deadline?: boolean,
  event?: boolean,
) => {

  // 
  let query

  if (taskId
    && (recurringRandom == undefined)
    && (rruleEvent == undefined)
    && (deadline == undefined)
    && (event == undefined)) {

    const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)
    return task?.events
  } else {
    // build query
    query = ''
    if (recurringRandom && rruleEvent && deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && rruleEvent && deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && rruleEvent && !deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && !rruleEvent && deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && rruleEvent && deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && rruleEvent && !deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && !rruleEvent && !deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && !rruleEvent && !deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && rruleEvent && !deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && !rruleEvent && deadline && event) {
      query += 'recurringRandom == $0 &&  rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && !rruleEvent && !deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && !rruleEvent && !deadline && event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && !rruleEvent && deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && rruleEvent && !deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (recurringRandom && !rruleEvent && deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && rruleEvent && deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    } else if (!recurringRandom && !rruleEvent && !deadline && !event) {
      query += 'recurringRandom == $0 && rruleEvent == $1 && deadline == $2 && event == $3'
    }
  }


  /** if (recurringRandom) {
    query += 'recurringRandom == true'
  } else if (rruleEvent) {
    query += 'rruleEvent == true'
  } */

  const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

  const events = task?.events?.filtered(query, recurringRandom, rruleEvent, deadline, event)


  // 

  // setOSEventsForTask(eventList)
  return events
  // const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)
  //
  // if (task && task.events && task.events.length > 0) {
  //   const taskEvents = task.events
  //   setOSEventsForTask(taskEvents)
  //   return taskEvents
  // }
}

export const readRealmEvents = (
  primaryGoalType: string,
  secondaryGoalType?: string,
  recurringRandom?: boolean,
) => {
  let query

  if ((secondaryGoalType === undefined) && (recurringRandom === undefined)) {

    query = `primaryGoalType == ${primaryGoalType}`

    const events = realm.objects<LocalEvent>('Event').filtered(query)

    return events

  } else if ((secondaryGoalType !== undefined) && (recurringRandom === undefined)) {

    query = `primaryGoalType == ${primaryGoalType}`

    query += ` && secondaryGoalType == $0`

    const events = realm.objects<LocalEvent>('Event').filtered(query, secondaryGoalType)

    return events

  } else if ((secondaryGoalType !== undefined) && (recurringRandom !== undefined)) {
    // build query
    query = `primaryGoalType == ${primaryGoalType}`

    query += ` && secondaryGoalType == $0`

    query += '  && recurringRandom == $1'

    const events = realm.objects<LocalEvent>('Event').filtered(query, secondaryGoalType, recurringRandom)

    return events
  }
}

export const deleteRealmEventsForTask = (
  taskId: string,
) => {
  realm.write(() => {
    const events = realm.objectForPrimaryKey<TaskRealm>('Task', taskId)?.events
    // const query = `assignee.id == ${taskId}`
    // const events = realm.objects<LocalEvent>('Event').filtered(query)
    if (events?.[0]?.id) {
      realm?.delete(events)
    } else {
      // 
    }
  })
}

export const delRealmEventsForGoalType = (
  primaryGoalType: string,
  secondaryGoalType?: string,
  recurringRandom?: boolean,
) => {
  realm.write(() => {
    let query

    if ((recurringRandom == undefined)) {

      query = `primaryGoalType == ${primaryGoalType}`

      if (secondaryGoalType) {
        query += ` && secondaryGoalType == ${secondaryGoalType}`
      }
    } else {
      // build query
      query = `primaryGoalType == ${primaryGoalType}`

      if (secondaryGoalType) {
        query += ` && secondaryGoalType == ${secondaryGoalType}`
      }

      if (recurringRandom) {
        query += '  && recurringRandom == true'
      }
    }

    const events = realm.objects<LocalEvent>('Event').filtered(query)

    realm.delete(events)
  })
}

export const delScheduleRealmEventsOfTask = (taskId: string) => {
  realm.write(() => {
    // const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

    const events = readRealmEventsForTask(taskId, true, false, false, false)

    // 

    if (events && events.length > 0) {

      realm.delete(events)
    }

  })
}

export const delDeadlineRealmEventsOfTask = (taskId: string) => {
  realm.write(() => {
    // const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

    const events = readRealmEventsForTask(taskId, false, false, true, false)

    // 

    if (events && events.length > 0) {

      realm.delete(events)
    }

  })
}

export const delEventRealmEventsOfTask = (taskId: string) => {
  realm.write(() => {
    // const task = realm.objectForPrimaryKey<LocalTask>('Task', taskId)

    const events = readRealmEventsForTask(taskId, false, false, false, true)

    if (events?.[0]?.id) {

      realm.delete(events)
    }

  })
}



export const createCalendarEventFromUTC = async (
  calendarEventIdEl: CalendarEventIdElType,
  startDate: string,
  endDate: string, // endDate for the first event
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[],
  notes?: string,
): Promise<string> => {
  try {
    if (!(calendarEventIdEl?.current)) {
      return
    }
    // 
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs.utc(startDate).local().valueOf(),
        endDate: dayjs.utc(endDate).local().isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs.utc(recurringEndDate).local().valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId

    } else {

      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs.utc(startDate).local().valueOf(),
        endDate: dayjs.utc(endDate).local().isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs.utc(recurringEndDate).local().valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    }
  } catch (e) {

  }
}

export const createCalendarEventFromUTCOfTask = async (
  calendarId: string,
  startDate: string,
  endDate: string, // endDate for the first event
  // taskId: string,
  // recurringStartDate?: string,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[],
  notes?: string,
): Promise<string> => {
  try {
    if (!calendarId) {
      return
    }
    // 
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId,
        startDate: dayjs.utc(startDate).local().valueOf(),
        endDate: dayjs.utc(endDate).local().isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs.utc(recurringEndDate).local().valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId

    } else {

      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId,
        startDate: dayjs.utc(startDate).local().valueOf(),
        endDate: dayjs.utc(endDate).local().isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs.utc(recurringEndDate).local().valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    }
  } catch (e) {

  }
}

export const createCalendarEvent = async (
  calendarEventIdEl: CalendarEventIdElType,
  startDate: string,
  endDate: string, // endDate for the first event
  // taskId: string,
  // recurringStartDate?: string,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[],
  notes?: string,
): Promise<string> => {
  if (!(calendarEventIdEl?.current)) {
    return
  }
  try {
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    } else {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    }
  } catch (e) {

  }    // 
}

export const createCalendarEventOfTask = async (
  calendarId: string,
  startDate: string,
  endDate: string, // endDate for the first event
  // taskId: string,
  // recurringStartDate?: string,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[],
  notes?: string,
): Promise<string> => {
  if (!(calendarId)) {
    return
  }
  try {
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    } else {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms && (deadlineAlarms.length > 0)
          ? [...deadlineAlarms.map(i => ({
            date: dayjs(i).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          })), {
            date: 0
          }]
          : [{
            date: 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      // 
      return newEventId
    }
  } catch (e) {

  }    // 
}

export const deleteCalendarEvent = async (
  eventId: string,
) => {
  try {
    await RNCalendarEvents.removeEvent(eventId, { futureEvents: true })
    // 
  } catch (e) {
    // 
  }
}

const getRRuleDay = (value: Day) => {
  // 
  switch (value) {
    case 'MO':
      // 
      return RRule.MO

    case 'TU':
      // 
      return RRule.TU

    case 'WE':
      // 
      return RRule.WE

    case 'TH':
      // 
      return RRule.TH

    case 'FR':
      // 
      return RRule.FR

    case 'SA':
      // 
      return RRule.SA

    case 'SU':
      // 
      return RRule.SU

    default:
      return RRule.MO

  }
}

// extract minutes

const extractMinutes = (hours: string[]) => {
  const matches = hours.map(i => i.match(/\.\d+/gm))

  let minutes: number[] = []

  if (matches?.[0]) {
    for (let i = 0; i < matches.length; i++) {
      const value = parseFloat(matches[i] as unknown as string)

      if (typeof value === 'number') {
        const minuteValue = math.chain(value).multiply(60).done()

        minutes.push(minuteValue)
      }
    }



    if (minutes?.[0]) {
      return minutes
    }
  }
  return
}

export const generateTimesForEveryDay = async (
  days: Day[],
  startDate: string,
  endDate: string,
  hours: number[],
) => {
  try {
    if (!(days?.length > 0)) {

      return
    }






    const minutes = extractMinutes(hours.map(i => `${i}`))

    const rule = new RRule({
      freq: RRule.WEEKLY,
      dtstart: dayjs(startDate).toDate(),
      until: dayjs(endDate).toDate(),
      interval: 1,
      byweekday: days?.length === 1 ? getRRuleDay(days[0]) : days.map(day => getRRuleDay(day)),
      byhour: hours,
      byminute: (minutes?.[0] && (typeof (minutes?.[0]) === 'number')) ? minutes : [0],
      bysecond: [0]
    })



    // const dates = rule.all()

    // 

    return rule.all()
  } catch (e) {

  }
}

export const cleanUpActivitySchedule = async (
  primaryGoalType: string,
  secondaryGoalType: string,
  recurring?: boolean
) => {
  try {
    const oldEventObjects = readRealmEvents(primaryGoalType, secondaryGoalType, recurring)

    if (oldEventObjects?.[0]?.id) {

      const oldEvents = Array.from(oldEventObjects)

      // 
      const oldEventsPromises = oldEvents.map(async (oldEvent) => deleteCalendarEvent(oldEvent.id))

      await Promise.all(oldEventsPromises)
    }

    delRealmEventsForGoalType(primaryGoalType, secondaryGoalType, recurring)

  } catch (e) {

  }
}

export const cleanUpTaskSchedule = async (
  idArray: string[],
  index: number,
  localTaskType: taskType,
) => {
  try {
    const taskId = idArray[index]

    const original: DailyToDo
      | WeeklyToDo
      | MasterToDo
      | GroceryToDo = await DataStore.query(getToDoType(localTaskType), taskId)

    if (original?.scheduleId) {

      // const ToDoType = getToDoType(localTaskType)
      switch (localTaskType) {
        case 'Daily':
          await DataStore.save(
            DailyToDo.copyOf(
              original, updated => {
                updated.scheduleId = undefined
                updated.startDate = undefined
                updated.endDate = undefined
              }
            )
          )
        case 'Weekly':
          await DataStore.save(
            WeeklyToDo.copyOf(
              original, updated => {
                updated.scheduleId = undefined
                updated.startDate = undefined
                updated.endDate = undefined
              }
            )
          )
        case 'Master':
          await DataStore.save(
            MasterToDo.copyOf(
              original, updated => {
                updated.scheduleId = undefined
                updated.startDate = undefined
                updated.endDate = undefined
              }
            )
          )
        case 'Grocery':
          await DataStore.save(
            GroceryToDo.copyOf(
              original, updated => {
                updated.scheduleId = undefined
                updated.startDate = undefined
                updated.endDate = undefined
              }
            )
          )
      }

      const scheduleToDo = await DataStore.query(ScheduleToDo, original.scheduleId)

      if (scheduleToDo) {
        await DataStore.delete(scheduleToDo)
      }
    }

  } catch (e) {

  }
}

const createRruleCalendarEvents = async (
  // taskId: string,
  calendarEventIdEl: CalendarEventIdElType,
  rRuleStr: string,
  title?: string,
  notes?: string,
) => {
  try {
    if (!(calendarEventIdEl?.current)) {
      // 
      return

    }
    /** extract times and create rrule config object */

    const rule = RRule.fromText(rRuleStr)

    const calendarDates = rule.all()

    const promises = calendarDates.map(i => RNCalendarEvents.saveEvent(
      title || notes,
      {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs(i).valueOf(),
        endDate: dayjs(i).valueOf(),
        notes,
        alarms: [
          {
            date: Platform.OS === 'ios' ? -60 : 60,
          },
          {
            date: Platform.OS === 'ios' ? -30 : 30,
          },
          {
            date: Platform.OS === 'ios' ? -15 : 15,
          },
          {
            date: Platform.OS === 'ios' ? -0 : 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
      }
    ))

    const eventIds = await Promise.all(promises)
    // 

    return { eventIds, calendarDates }

  } catch (e) {

  }
}

export const createRruleCalendarEventsOfTask = async (
  // taskId: string,
  calendarId: string,
  rRuleStr: string,
  title?: string,
  notes?: string,
) => {
  try {
    if (!(calendarId)) {
      // 
      return

    }
    /** extract times and create rrule config object */

    const rule = RRule.fromText(rRuleStr)

    const calendarDates = rule.all()

    const promises = calendarDates.map(i => RNCalendarEvents.saveEvent(
      title || notes,
      {
        calendarId,
        startDate: dayjs(i).valueOf(),
        endDate: dayjs(i).valueOf(),
        notes,
        alarms: [
          {
            date: Platform.OS === 'ios' ? -60 : 60,
          },
          {
            date: Platform.OS === 'ios' ? -30 : 30,
          },
          {
            date: Platform.OS === 'ios' ? -15 : 15,
          },
          {
            date: Platform.OS === 'ios' ? -0 : 0,
          }],
        timeZone: RNLocalize.getTimeZone(),
      }
    ))

    const eventIds = await Promise.all(promises)
    // 

    return { eventIds, calendarDates }

  } catch (e) {

  }
}

const createRruleRealmEvents = async (
  eventIds: string[],
  startDate: string[],
  endDate: string[],
  taskId: string,
  calendarId: string,
  primaryGoalType: PrimaryGoalType,
  title?: string,
  notes?: string,
  secondaryGoalType?: string,
) => {
  try {
    if (eventIds && eventIds.length > 0) {
      const promises = eventIds.map((eventId, idx) => createRealmEvent(
        eventId,
        startDate[idx],
        endDate[idx],
        taskId,
        calendarId,
        primaryGoalType,
        false,
        true,
        false,
        false,
        undefined,
        undefined,
        title,
        notes,
        undefined,
        undefined,
        secondaryGoalType,
      ))

      await Promise.all(promises)
    }
  } catch (e) {
    // 
  }
}


export const createRruleSchedule = async (
  calendarEventIdEl: CalendarEventIdElType,
  rRuleStr: string,
  taskId: string,
  primaryGoalType: PrimaryGoalType,
  title?: string,
  notes?: string,
  secondaryGoalType?: string,
) => {
  try {

    if (!(calendarEventIdEl.current)) {
      return
    }

    const values = await createRruleCalendarEvents(
      calendarEventIdEl,
      rRuleStr,
      title,
      notes,
    )

    // 

    if (values?.eventIds?.[0]
      && values?.calendarDates?.[0]) {

      const { eventIds, calendarDates } = values

      const dateStrings = calendarDates.map(i => dayjs(i).format())

      await createRruleRealmEvents(
        eventIds,
        dateStrings,
        dateStrings,
        taskId,
        calendarEventIdEl.current,
        primaryGoalType,
        title,
        notes,
        secondaryGoalType,
      )

      return dateStrings
    }
    return
  } catch (e) {
    // 
    return
  }
}

export const createRruleScheduleOfTask = async (
  calendarId: string,
  rRuleStr: string,
  taskId: string,
  primaryGoalType: PrimaryGoalType,
  title?: string,
  notes?: string,
  secondaryGoalType?: string,
) => {
  try {

    if (!calendarId) {
      return
    }


    const values = await createRruleCalendarEventsOfTask(
      calendarId,
      rRuleStr,
      title,
      notes,
    )

    // 

    if (values?.eventIds?.[0]
      && values?.calendarDates?.[0]) {

      const { eventIds, calendarDates } = values

      const dateStrings = calendarDates.map(i => dayjs(i).format())

      await createRruleRealmEvents(
        eventIds,
        dateStrings,
        dateStrings,
        taskId,
        calendarId,
        primaryGoalType,
        title,
        notes,
        secondaryGoalType,
      )

      return dateStrings
    }
    return
  } catch (e) {
    // 
    return
  }
}

export const delRruleCalendarEvents = async (
  idArray: string[],
  index: number,
) => {
  try {
    const taskId = idArray[index]

    if (!taskId) {
      // 
    }

    const realmEvents = readRealmEventsForTask(taskId, false, true, false, false)


    if (realmEvents?.[0]?.id) {

      const promises = realmEvents.map(event => deleteCalendarEvent(event.id))

      await Promise.all(promises)
    } else {
      // 
    }

  } catch (e) {
    // 
  }
}

export const delRruleCalendarEventsOfTask = async (
  taskId: string,
) => {
  try {

    if (!taskId) {
      // 
    }

    const realmEvents = readRealmEventsForTask(taskId, false, true, false, false)


    if (realmEvents?.[0]?.id) {

      const promises = realmEvents.map(event => deleteCalendarEvent(event.id))

      await Promise.all(promises)
    } else {
      // 
    }

  } catch (e) {
    // 
  }
}

export const delRruleRealmEvents = (
  idArray: string[],
  index: number,
) => {
  const taskId = idArray[index]

  if (!taskId) {
    // 
    return
  }

  realm.write(() => {
    const task = realm.objectForPrimaryKey<TaskRealm>('Task', taskId)

    const events = task?.events?.filtered(
      'rruleEvent == true'
    )

    if (events?.[0]?.id) {
      realm.delete(events)
    } else {
      // 
    }
  })


}

export const delRruleRealmEventsOfTask = (
  taskId: string,
) => {

  if (!taskId) {
    // 
    return
  }

  realm.write(() => {
    const task = realm.objectForPrimaryKey<TaskRealm>('Task', taskId)

    const events = task?.events?.filtered(
      'rruleEvent == true'
    )

    if (events?.[0]?.id) {
      realm.delete(events)
    } else {
      // 
    }
  })


}

export const delRruleSchedule = async (
  idArray: string[],
  index: number,
) => {
  try {

    await delRruleCalendarEvents(idArray, index)
    delRruleRealmEvents(idArray, index)

  } catch (e) {
    // 
    Toast.show({
      type: 'error',
      text1: 'Unable to remove auto schedule',
      text2: 'Unable to remove automated schedule for the task'
    })
  }
}

export const deleteExtractedDateCalendarEvent = async (
  idArray: string[],
  index: number,
) => {
  const taskId = idArray[index]

  if (!taskId) {
    // 
    return
  }

  const events = readRealmEventsForTask(taskId, false, false, false, false)

  if (events?.[0]?.id) {
    const promises = events.map(async (e) => deleteCalendarEvent(e.id))
    await Promise.all(promises)
  }
}

export const deleteExtractedDateCalendarEventOfTask = async (
  taskId: string,
) => {

  if (!taskId) {
    // 
    return
  }

  const events = readRealmEventsForTask(taskId, false, false, false, false)

  if (events?.[0]?.id) {
    const promises = events.map(async (e) => deleteCalendarEvent(e.id))
    await Promise.all(promises)
  }
}

export const deleteExtractedDateRealmEvent = (
  idArray: string[],
  index: number,
) => {

  const taskId = idArray[index]

  if (!taskId) {
    // 
    return
  }

  realm.write(() => {
    const events = realm.objectForPrimaryKey<TaskRealm>('Task', taskId)?.events?.filtered(
      `recurringRandom == false && rruleEvent == $0 && deadline == $1 && event == $2`,
      false, false, true,
    )

    if (events?.[0]?.id) {
      realm.delete(events)
    } else {
      // 
    }
  })
}

export const deleteExtractedDateRealmEventOfTask = (
  taskId: string,
) => {

  if (!taskId) {
    // 
    return
  }

  realm.write(() => {
    const events = realm.objectForPrimaryKey<TaskRealm>('Task', taskId)?.events?.filtered(
      `recurringRandom == false && rruleEvent == $0 && deadline == $1 && event == $2`,
      false, false, true,
    )

    if (events?.[0]?.id) {
      realm.delete(events)
    } else {
      // 
    }
  })
}

export const deleteExtractedDateEvent = async (
  idArray: string[],
  index: number,
) => {
  try {

    await deleteExtractedDateCalendarEvent(idArray, index)
    deleteExtractedDateRealmEvent(idArray, index)

  } catch (e) {
    // 
    Toast.show({
      type: 'error',
      text1: 'Unable to remove extracted event',
      text2: 'Unable to remove extracted event due to an internal error',
    })
  }
}

export const createToDoInRealm = (
  localTaskType: taskType,
  taskId: string,
  notes: string,
  completed?: boolean,
  startDate?: string,
  endDate?: string,
  completedDate?: string,
  nextDay?: boolean,
  important?: boolean,
  date?: string,
  event?: boolean,
  scheduleId?: string,
  deadline?: boolean,
  recurring?: boolean,
  extractedDate?: boolean,
  syncId?: string,
  syncName?: string,
  status?: string,
  parentId?: string,
  order?: number,
) => {
  switch (localTaskType) {
    case 'Daily':
      realm.write(() => {
        realm.create<DailyToDoRealm>('DailyToDo', {
          id: taskId,
          notes,
          completed,
          startDate,
          endDate,
          completedDate,
          nextDay,
          important,
          date,
          event,
          scheduleId,
          deadline,
          recurring,
          extractedDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      })
      break

    case 'Weekly':
      realm.write(() => {
        realm.create<WeeklyToDoRealm>('WeeklyToDo', {
          id: taskId, notes,
          completed,
          startDate,
          endDate,
          completedDate,
          nextDay,
          important,
          date,
          event,
          scheduleId,
          deadline,
          recurring,
          extractedDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      })
      break

    case 'Master':
      realm.write(() => {
        realm.create<MasterToDoRealm>('MasterToDo', {
          id: taskId,
          notes,
          completed,
          startDate,
          endDate,
          completedDate,
          nextDay,
          important,
          date,
          event,
          scheduleId,
          deadline,
          recurring,
          extractedDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      })
      break

    case 'Grocery':
      realm.write(() => {
        realm.create<GroceryToDoRealm>('GroceryToDo', {
          id: taskId,
          notes,
          completed,
          startDate,
          endDate,
          completedDate,
          nextDay,
          important,
          date,
          event,
          scheduleId,
          deadline,
          recurring,
          extractedDate,
          syncId,
          syncName,
          status,
          parentId,
          order,
        })
      })
      break
  }

}

export const updateToDoInRealm = (
  localTaskType: taskType,
  taskId: string,
  notes?: string,
  completed?: boolean,
  startDate?: string,
  endDate?: string,
  completedDate?: string,
  nextDay?: boolean,
  important?: boolean,
  date?: string,
  event?: boolean,
  scheduleId?: string,
  deadline?: boolean,
  recurring?: boolean,
  extractedDate?: boolean,
  syncId?: string,
  syncName?: string,
  status?: string,
  parentId?: string,
  order?: number,
) => {
  // 
  switch (localTaskType) {
    case 'Daily':
      realm.write(() => {
        const dailyToDo = realm.objectForPrimaryKey<DailyToDoRealm>('DailyToDo', taskId)
        // 
        if (dailyToDo) {
          // 
          if (notes !== undefined) {
            // 
            dailyToDo.notes = notes
          }

          if (completed !== undefined) {
            // 
            if (dailyToDo.completed !== completed) {
              dailyToDo.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (dailyToDo.startDate !== startDate) {
              dailyToDo.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            // 
            if (dailyToDo.endDate !== endDate) {
              dailyToDo.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (dailyToDo.completedDate !== completedDate) {
              dailyToDo.completedDate = completedDate
            }
          }

          if (nextDay !== undefined) {
            // 
            if (dailyToDo.nextDay !== nextDay) {
              dailyToDo.nextDay = nextDay
            }
          }

          if (important !== undefined) {
            // 
            if (dailyToDo.important !== important) {
              dailyToDo.important = important
            }
          }

          if (date !== undefined) {
            // 
            if (dailyToDo.date !== date) {
              dailyToDo.date = date
            }
          }

          if (event !== undefined) {
            // 
            if (dailyToDo.event !== event) {
              dailyToDo.event = event
            }
          }

          if (scheduleId !== undefined) {
            // 
            // 
            if (dailyToDo.scheduleId !== scheduleId) {
              dailyToDo.scheduleId = scheduleId
            }
            // 
          }

          if (deadline !== undefined) {
            // 
            if (dailyToDo.deadline !== deadline) {
              dailyToDo.deadline = deadline
            }
          }

          if (recurring !== undefined) {
            // 
            if (dailyToDo.recurring !== recurring) {
              dailyToDo.recurring = recurring
            }
          }

          if (extractedDate !== undefined) {
            // 
            if (dailyToDo.extractedDate !== extractedDate) {
              dailyToDo.extractedDate = extractedDate
            }
          }

          if (syncId !== undefined) {
            if (dailyToDo.syncId !== syncId) {
              dailyToDo.syncId = syncId
            }
          }

          if (syncName !== undefined) {
            if (dailyToDo.syncName !== syncName) {
              dailyToDo.syncName = syncName
            }
          }

          if (status !== undefined) {
            if (dailyToDo.status !== status) {
              dailyToDo.status = status
            }
          }

          if (parentId !== undefined) {
            if (dailyToDo.parentId !== parentId) {
              dailyToDo.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (dailyToDo.order !== order) {
              dailyToDo.order = order
            }
          }
        }
      })
      break
    case 'Weekly':
      realm.write(() => {
        const weeklyToDo = realm.objectForPrimaryKey<WeeklyToDoRealm>('WeeklyToDo', taskId)
        if (weeklyToDo) {
          if (notes !== undefined) {
            weeklyToDo.notes = notes
          }

          if (completed !== undefined) {
            // 
            if (weeklyToDo.completed !== completed) {
              weeklyToDo.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (weeklyToDo.startDate !== startDate) {
              weeklyToDo.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            // 
            if (weeklyToDo.endDate !== endDate) {
              weeklyToDo.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (weeklyToDo.completedDate !== completedDate) {
              weeklyToDo.completedDate = completedDate
            }
          }

          if (nextDay !== undefined) {
            // 
            if (weeklyToDo.nextDay !== nextDay) {
              weeklyToDo.nextDay = nextDay
            }
          }

          if (important !== undefined) {
            // 
            if (weeklyToDo.important !== important) {
              weeklyToDo.important = important
            }
          }

          if (event !== undefined) {
            // 
            if (weeklyToDo.event !== event) {
              weeklyToDo.event = event
            }
          }

          if (scheduleId !== undefined) {
            // 
            // 
            if (weeklyToDo.scheduleId !== scheduleId) {
              weeklyToDo.scheduleId = scheduleId
            }
            // 
          }

          if (deadline !== undefined) {
            // 
            if (weeklyToDo.deadline !== deadline) {
              weeklyToDo.deadline = deadline
            }
          }

          if (recurring !== undefined) {
            // 
            if (weeklyToDo.recurring !== recurring) {
              weeklyToDo.recurring = recurring
            }
          }

          if (extractedDate !== undefined) {
            // 
            if (weeklyToDo.extractedDate !== extractedDate) {
              weeklyToDo.extractedDate = extractedDate
            }
          }

          if (syncId !== undefined) {
            if (weeklyToDo.syncId !== syncId) {
              weeklyToDo.syncId = syncId
            }
          }

          if (syncName !== undefined) {
            if (weeklyToDo.syncName !== syncName) {
              weeklyToDo.syncName = syncName
            }
          }

          if (status !== undefined) {
            if (weeklyToDo.status !== status) {
              weeklyToDo.status = status
            }
          }

          if (parentId !== undefined) {
            if (weeklyToDo.parentId !== parentId) {
              weeklyToDo.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (weeklyToDo.order !== order) {
              weeklyToDo.order = order
            }
          }
        }
      })
      break
    case 'Master':
      realm.write(() => {
        const masterToDo = realm.objectForPrimaryKey<MasterToDoRealm>('MasterToDo', taskId)
        if (masterToDo) {

          if (notes !== undefined) {
            masterToDo.notes = notes
          }

          if (completed !== undefined) {
            // 
            if (masterToDo.completed !== completed) {
              masterToDo.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (masterToDo.startDate !== startDate) {
              masterToDo.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            // 
            if (masterToDo.endDate !== endDate) {
              masterToDo.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (masterToDo.completedDate !== completedDate) {
              masterToDo.completedDate = completedDate
            }
          }

          if (nextDay !== undefined) {
            // 
            if (masterToDo.nextDay !== nextDay) {
              masterToDo.nextDay = nextDay
            }
          }

          if (important !== undefined) {
            // 
            if (masterToDo.important !== important) {
              masterToDo.important = important
            }
          }

          if (event !== undefined) {
            // 
            if (masterToDo.event !== event) {
              masterToDo.event = event
            }
          }

          if (scheduleId !== undefined) {
            // 
            // 
            if (masterToDo.scheduleId !== scheduleId) {
              masterToDo.scheduleId = scheduleId
            }
            // 
          }

          if (deadline !== undefined) {
            // 
            if (masterToDo.deadline !== deadline) {
              masterToDo.deadline = deadline
            }
          }

          if (recurring !== undefined) {
            // 
            if (masterToDo.recurring !== recurring) {
              masterToDo.recurring = recurring
            }
          }

          if (extractedDate !== undefined) {
            // 
            if (masterToDo.extractedDate !== extractedDate) {
              masterToDo.extractedDate = extractedDate
            }
          }

          if (syncId !== undefined) {
            if (masterToDo.syncId !== syncId) {
              masterToDo.syncId = syncId
            }
          }

          if (syncName !== undefined) {
            if (masterToDo.syncName !== syncName) {
              masterToDo.syncName = syncName
            }
          }

          if (status !== undefined) {
            if (masterToDo.status !== status) {
              masterToDo.status = status
            }
          }

          if (parentId !== undefined) {
            if (masterToDo.parentId !== parentId) {
              masterToDo.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (masterToDo.order !== order) {
              masterToDo.order = order
            }
          }
        }
      })
      break
    case 'Grocery':
      realm.write(() => {
        const groceryToDo = realm.objectForPrimaryKey<GroceryToDoRealm>('GroceryToDo', taskId)
        if (groceryToDo) {

          if (notes !== undefined) {
            groceryToDo.notes = notes
          }

          if (completed !== undefined) {
            // 
            if (groceryToDo.completed !== completed) {
              groceryToDo.completed = completed
            }
          }

          if (startDate !== undefined) {
            if (groceryToDo.startDate !== startDate) {
              groceryToDo.startDate = startDate
            }
          }

          if (endDate !== undefined) {
            // 
            if (groceryToDo.endDate !== endDate) {
              groceryToDo.endDate = endDate
            }
          }

          if (completedDate !== undefined) {
            if (groceryToDo.completedDate !== completedDate) {
              groceryToDo.completedDate = completedDate
            }
          }

          if (nextDay !== undefined) {
            // 
            if (groceryToDo.nextDay !== nextDay) {
              groceryToDo.nextDay = nextDay
            }
          }

          if (important !== undefined) {
            // 
            if (groceryToDo.important !== important) {
              groceryToDo.important = important
            }
          }

          if (event !== undefined) {
            // 
            if (groceryToDo.event !== event) {
              groceryToDo.event = event
            }
          }

          if (scheduleId !== undefined) {
            // 
            // 
            if (groceryToDo.scheduleId !== scheduleId) {
              groceryToDo.scheduleId = scheduleId
            }
            // 
          }

          if (deadline !== undefined) {
            // 
            if (groceryToDo.deadline !== deadline) {
              groceryToDo.deadline = deadline
            }
          }

          if (recurring !== undefined) {
            // 
            if (groceryToDo.recurring !== recurring) {
              groceryToDo.recurring = recurring
            }
          }

          if (extractedDate !== undefined) {
            // 
            if (groceryToDo.extractedDate !== extractedDate) {
              groceryToDo.extractedDate = extractedDate
            }
          }

          if (syncId !== undefined) {
            if (groceryToDo.syncId !== syncId) {
              groceryToDo.syncId = syncId
            }
          }

          if (syncName !== undefined) {
            if (groceryToDo.syncName !== syncName) {
              groceryToDo.syncName = syncName
            }
          }

          if (status !== undefined) {
            if (groceryToDo.status !== status) {
              groceryToDo.status = status
            }
          }

          if (parentId !== undefined) {
            if (groceryToDo.parentId !== parentId) {
              groceryToDo.parentId = parentId
            }
          }

          if (order !== undefined) {
            if (groceryToDo.order !== order) {
              groceryToDo.order = order
            }
          }
        }
      })
      break
  }
}

export const deleteTaskInRealm = (
  localTaskType: taskType,
  taskId: string,
) => {
  switch (localTaskType) {
    case 'Daily':
      realm.write(() => {
        const dailyToDo = realm.objectForPrimaryKey('DailyToDo', taskId)
        realm.delete(dailyToDo)
      })
      break
    case 'Weekly':
      realm.write(() => {
        const weeklyToDo = realm.objectForPrimaryKey('WeeklyToDo', taskId)
        realm.delete(weeklyToDo)
      })
      break
    case 'Master':
      realm.write(() => {
        const masterToDo = realm.objectForPrimaryKey('MasterToDo', taskId)
        realm.delete(masterToDo)
      })
      break
    case 'Grocery':
      realm.write(() => {
        const groceryToDo = realm.objectForPrimaryKey('GroceryToDo', taskId)
        realm.delete(groceryToDo)
      })
      break
  }
}

export const uploadPictureForListPosts = async (
  // s3El: s3El,
  userId: string,
  // credIdEl: credIdEl,
  file: Buffer,
  name: string,
  type: string,
) => {
  try {

    // 
    // 



    const credentials = await Auth.currentCredentials()


    const newS3 = new S3Client({
      region: bucketRegion,
      credentials: Auth.essentialCredentials(credentials),
      // signatureVersion: 'v4', only used for kms encryption
      //  apiVersion: '2006-03-01',
      // params: { Bucket: bucketName },
    })

    const params = {
      Body: file,
      Bucket: bucketName,
      Key: `${credentials.identityId}/${userId}/${escapeUnsafe(name)}.${type}`,
      // ContentEncoding: 'base64',
      'Content-Type': `image/${type}`,
    }

    if (newS3) {
      const res = await newS3.send(new PutObjectCommand(params))



      return `${credentials.identityId}/${userId}/${escapeUnsafe(name)}.${type}`
    }



    return undefined
  } catch (e) {

    return undefined
  }
}

export const uploadPicture = async (
  // s3El: s3El,
  userIdEl: userIdEl,
  // credIdEl: credIdEl,
  file: Buffer,
  name: string,
  // type: string,
) => {
  try {

    // 
    // 



    const credentials = await Auth.currentCredentials();
    const newS3 = new S3Client({
      region: bucketRegion,
      credentials: Auth.essentialCredentials(credentials),
      // signatureVersion: 'v4', only used for kms encryption
      //  apiVersion: '2006-03-01',
      // params: { Bucket: bucketName },
    })

    const params = {
      Body: file,
      Bucket: bucketName,
      Key: `${credentials.identityId}/${userIdEl?.current}/${escapeUnsafe(name)}.png`,
      // ContentEncoding: 'base64',
      'Content-Type': `image/png`,
    }

    if (newS3) {
      const res = await newS3.send(new PutObjectCommand(params))



      return `${credentials.identityId}/${userIdEl?.current}/${escapeUnsafe(name)}.png`
    }



    return undefined
  } catch (e) {

    return undefined
  }
};

export const updatePostRealm = (
  id: string,
  image?: string,
  caption?: string,
) => {
  if (!id) {

    return
  }

  realm.write(() => {
    const post = realm.objectForPrimaryKey<PostRealm>('Post', id)

    if (post?.id) {
      if (image !== undefined) {
        post.image = image
      }

      if (caption !== undefined) {
        post.caption = caption
      }
    }
  })
}

export const createPostRealmForNavigation = (id: string, date?: string, dateDay?: string, image?: string) => {

  let post: PostRealm | undefined




  realm.write(() => {
    const postRealm = realm.create<PostRealm & Realm.Object>('Post', {
      id,
      dateDay,
      date,
      image,
    })

    post = postRealm
  })







  return post
}

export const createPostRealm = (uri: string) => {

  let post: PostRealm | undefined

  const id = ulid()



  realm.write(() => {
    const postRealm = realm.create<PostRealm & Realm.Object>('Post', {
      id,
      dateDay: dayjs().format('YYYY-MM-DD'),
      date: id,
      image: uri,
    })

    post = postRealm
  })







  return post
}

export const createScheduleToDoInStore = async (
  userIdEl: userIdEl,
  taskId: string,
  startDate: string,
  endDate: string,
  frequency: RecurrenceFrequency,
  dayFrequency?: number,
  interval?: number,
  byWeekDay?: dayType[],
  dayReminder?: boolean,
  dayReminderTimeRange?: string[],
  dayReminderTimes?: string[],
  deadlineAlarms?: string[],
) => {
  try {

    const schedule = await DataStore.save(
      new ScheduleToDo({
        taskId,
        status: Status.ACTIVE,
        userId: userIdEl?.current,
        date: dayjs().format(),
        dayFrequency,
        frequency: recurrenceFrequency[frequency],
        interval,
        startDate,
        endDate,
        byWeekDay: byWeekDay as Day[],
        dayReminder,
        dayReminderTimeRange,
        dayReminderTimes,
        deadlineAlarms,
        ttl: dayjs(endDate).add(6, 'M').unix(),
      })
    )
    // 
    return schedule.id

  } catch (e) {
    // 
  }
}
