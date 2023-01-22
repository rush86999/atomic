import React, { useState, useEffect, useRef } from 'react'
import { Appearance } from 'react-native'
import { dayjs, RNLocalize } from '@app/date-utils'
import Realm from 'realm'

import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import { v4 as uuid } from 'uuid'
import PushNotification from 'react-native-push-notification'
import { Platform, TouchableOpacity } from 'react-native'

import { Menu } from 'react-native-paper'
import RNCalendarEvents from 'react-native-calendar-events'
import { Overlay } from 'react-native-elements/src'
import { TextField } from 'react-native-ui-lib'
import * as mathjs from 'mathjs'

import Ionicons from 'react-native-vector-icons/Ionicons'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import { palette } from '@theme/theme'

import Button from '@components/Button'


import { formatTimer } from '@utils/time'

import { TaskTimer } from '@realm/TaskTimer'

type taskType = 'Daily'|'Weekly'|'Master'

type RootStackParamList = {
  UserTaskTimer: {
    taskType: taskType,
    },
  UserTask: {
    taskType: taskType,
  },
}

type UserTaskTimerNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserTaskTimer'
>;

type UserTaskTimerRouteProp = RouteProp<
  RootStackParamList,
  'UserTaskTimer'>



type Props = {
  sub: string,
  route: UserTaskTimerRouteProp,
  getRealmApp: () => Realm,
}

const dark = Appearance.getColorScheme() === 'dark'
const CALENDARNAME = 'Task Timer'

function UserTaskTimer(props: Props) {
  const [breakTimeDurationDisplay, setBreakTimeDurationDisplay] = useState<string>('')

  const [breakEpisodesDisplay, setBreakEpisodesDisplay] = useState<string>('')
  const [isBreak, setIsBreak] = useState<boolean>(false)

  const [workTimeDurationDisplay, setWorkTimeDurationDisplay] = useState<string>('')

  const [workEpisodesDisplay, setWorkEpisodesDisplay] = useState<string>('')

  const [activeTime, setActiveTime] = useState<number>(0)
  const [totalActiveTime, setTotalActiveTime] = useState<number>(0)
  const [accumulatedDuration, setAccumulatedDuration] = useState<number>(0)
  const [isForm, setIsForm] = useState<boolean>(true)
  const [isInitial, setIsInitial] = useState<boolean>(true)
  const [isPause, setIsPause] = useState<boolean>(false)
  const [isMenu, setIsMenu] = useState<boolean>(false)
  const [calendarEventId, setCalendarEventId] = useState<string>('')

  const calendarEventIdEl = useRef<string>('')
  const eventIdEl = useRef<string>('')
  const intervalIdEl = useRef<number>(0)
  const isValidatedEl = useRef<boolean>(false)

  const {
    route,
    sub,
    getRealmApp,
  } = props

  const taskType = route?.params?.taskType

  const realm = getRealmApp()

  const navigation = useNavigation<UserTaskTimerNavigationProp>()

  useEffect(() => {
    (async () => {
      const oldStatus = await RNCalendarEvents.checkPermissions()
      let status
      if (oldStatus !== 'authorized') {
        const newStatus = await RNCalendarEvents.requestPermissions();

        status = newStatus
      }

      if (status === 'authorized' || oldStatus === 'authorized') {
        const newCalendars = await RNCalendarEvents.findCalendars()

        const atomicCalendars = newCalendars.filter(each => each.title === CALENDARNAME)

        if (atomicCalendars && atomicCalendars.length > 0) {
          setCalendarEventId(atomicCalendars[0].id)
          calendarEventIdEl.current = atomicCalendars[0].id
          return
        }

        const defaultCalendarSource = Platform.OS === 'ios'
          ? newCalendars?.filter(each => each?.source === 'Default')?.[0]?.source
          : { isLocalAccount: true, name: CALENDARNAME, type: '' }

          const newCalendarId = Platform.OS === 'ios' ? await RNCalendarEvents.saveCalendar({
            title: CALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: undefined,
            name: CALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          }) : await RNCalendarEvents.saveCalendar({
            title: CALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: defaultCalendarSource as { isLocalAccount: boolean; name: string; type: string; },
            name: CALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          })
          setCalendarEventId(newCalendarId)
          calendarEventIdEl.current = newCalendarId
      } else {
        Toast.show({
          type: 'error',
          text1: 'Need Calendar Access',
          text2: 'Task Reminder works by setting reminders in your calendar and thus needs access to remind you of breaks and active time'
        })
      }
    })();
  }, [])

  useEffect(() => {
    (async () => {
      if (!(calendarEventIdEl?.current)) {
        return
      }

      const oldEvents = await RNCalendarEvents.fetchAllEvents(
        dayjs().subtract(1, 'y').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        dayjs().add(1, 'y').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        [calendarEventIdEl?.current],
      )

      if (oldEvents?.length > 0) {
        eventIdEl.current = oldEvents[0]?.id
      }

    })()
  }, [calendarEventId])

  useEffect(() => {
    const getTimer = () => {
      if (!realm) {
        return
      }
      realm.write(() => {
        const timers = realm.objects<TaskTimer>("TaskTimer")

         if (timers?.[0]?.startTime) {
           const timer = timers[0]

           if (timer.startTime === 'null') {
             return
           }

           if (timer.stopPressed) {
             
             return
           }

           const now = dayjs().format()
           const pastTime = timer.startTime


           const secondsElapsed = dayjs(now).diff(pastTime, 's')


           const prevAccumulatedDuration = timer.accumulatedDuration || 0


           setAccumulatedDuration(prevAccumulatedDuration + secondsElapsed)
           timer.accumulatedDuration = prevAccumulatedDuration + secondsElapsed

           if (!(timer?.isBreak)) {

             const pastLastActiveTime = timer.lastActiveTime || now


             const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')


             const prevActiveTime = timer.activeTime || 0


             setActiveTime(prevActiveTime + activeSecondsElapsed)
             timer.activeTime = prevActiveTime + activeSecondsElapsed


             timer.lastActiveTime = now


             const pastLastTotalActiveTime = timer.lastTotalActiveTime || now


             const totalActiveSecondsElapsed = dayjs(now).diff(pastLastTotalActiveTime, 's')


             const prevTotalActiveTime = timer.totalActiveTime || 0
             timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed


             timer.lastTotalActiveTime = now


           } else {

             const pastLastActiveTime = timer.lastActiveTime || now


             const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')


             const prevActiveTime = timer.activeTime || 0


             timer.activeTime = prevActiveTime + activeSecondsElapsed


             timer.lastActiveTime = now

           }

           const oldTimer = timers[0]
           timer.breakEpisode = oldTimer.breakEpisode || 0

           timer.breakTimeDuration = oldTimer.breakTimeDuration || 0


           timer.numberOfBreakEpisodes = oldTimer.numberOfBreakEpisodes || 0


           timer.workEpisode = oldTimer.workEpisode || 0
           timer.workTimeDuration = oldTimer.workTimeDuration || 0
           timer.numberOfWorkEpisodes = oldTimer.numberOfWorkEpisodes || 0

           setIsInitial(false)
           setIsForm(false)
           isValidatedEl.current = true
           setTotalActiveTime(oldTimer.totalActiveTime || 0)

           setActiveTime(oldTimer.activeTime || 0)


           if (oldTimer.isBreak) {
             if (secondsElapsed > timer.breakTimeDuration) {
               return switchPhase('Play')
             }
             return onResumePress()
           } else {
             if (secondsElapsed > timer.workTimeDuration) {
               return switchPhase('Break')
             }

             return onResumePress()
           }
         } else {
           realm.create("TaskTimer", {
             id: uuid(),
             startTime: 'null',
             isBreak: false,
             isPause: true,
             stopPressed: true,
           })
          }
      })
    }
    getTimer()
  }, [!!realm])

  useEffect(() => {
    return () => {
    }
  }, [])

  const onInitialStartPlay = async () => {
    const timers = realm.objects<TaskTimer>('TaskTimer')
    if (!(timers?.[0]?.id)) {
      
      realm.write(() => {
        realm.create("TaskTimer", {
          id: uuid(),
          startTime: 'null',
          isBreak: false,
          isPause: false,
          stopPressed: false,
        })
      })
    }

    const [timerRead] = timers

    if (!(timerRead?.workTimeDuration)) {
      Toast.show({
        type: 'error',
        text1: 'No activity duration chosen',
        text2: 'Please choose a length of time to be active'
      })
      setIsForm(true)
      return
    }

    if (timerRead?.workEpisode === 0) {
      Toast.show({
        type: 'error',
        text1: '0 activity episodes',
        text2: 'Please choose atleast 1 episode of activity'
      })
      setIsForm(true)
      return
    }

    if (!(timerRead?.breakTimeDuration) && timerRead?.workEpisode > 1) {
      Toast.show({
        type: 'error',
        text1: 'No break duration chosen',
        text2: 'Please choose a length of time for break'
      })
      setIsForm(true)
      return
    }

    if (timerRead?.breakTimeDuration && timerRead?.breakEpisode < 1) {
      Toast.show({
        type: 'error',
        text1: '0 break episodes',
        text2: 'Please choose atleast 1 episode of break'
      })
      setIsForm(true)
      return
    }

    if (timerRead?.numberOfWorkEpisodes < 1) {
      Toast.show({
        type: 'error',
        text1: 'No activity episode chosen',
        text2: 'Please choose atleast 1 episode of activity'
      })
      setIsForm(true)
      return
    }

    if (timerRead?.numberOfWorkEpisodes > 1 && timerRead?.numberOfBreakEpisodes < 1) {
      Toast.show({
        type: 'error',
        text1: 'No break episode chosen',
        text2: 'Please choose atleast 1 break episode for more than 1 activity episodes'
      })
      setIsForm(true)
      return
    }

    if (((timerRead.numberOfWorkEpisodes - 1) !== (timerRead.numberOfBreakEpisodes))
    && (timerRead.numberOfWorkEpisodes !== (timerRead.numberOfBreakEpisodes))) {
      Toast.show({
        type: 'error',
        text1: 'Inconsistent breaks and active time',
        text2: 'Break episodes should be equal to active episodes or active episodes - 1',
      })
      setIsForm(true)
      return
    }

    setIsBreak(false)
    setIsInitial(false)
    setActiveTime(0)
    setIsPause(false)
    isValidatedEl.current = true
    setIsForm(false)

    realm.write(() => {
      const timers = realm.objects<TaskTimer>('TaskTimer')

      if (!(timers?.[0]?.id)) {
        return
      }

      const [timer] = timers

      timer.isBreak = false
      timer.isPause = false
      timer.stopPressed = false
      timer.activeTime = 0
      timer.startTime = 'null'
      timer.accumulatedDuration = 0
      timer.lastActiveTime = ''
      timer.lastTotalActiveTime = ''
      timer.totalActiveTime = 0
    })

    if (timerRead.numberOfWorkEpisodes > 1) {
      PushNotification.localNotificationSchedule({
        channelId: sub,
        ticker: 'Active time ended',
        bigText: `Active time has ended.
        Break has started. Relax and enjoy the moment.`,
        id: 0,
        title: 'Active time ended',
        message: 'Active time has ended. Break time has started',
        userInfo: {
          type: 'timer',
        },
        number: 10,
        date: dayjs().add(timerRead.workTimeDuration, 's').toDate(),
        allowWhileIdle: true,
      })
    } else {
      PushNotification.localNotificationSchedule({
        channelId: sub,
        ticker: 'Active time ended',
        bigText: `Active time has ended. Good job!`,
        id: 0,
        title: 'Active time ended',
        message: 'Active time has ended.',
        userInfo: {
          type: 'timer',
        },
        number: 10,
        date: dayjs().add(timerRead.workTimeDuration, 's').toDate(),
        allowWhileIdle: true,
      })
    }

    const newEventId = await RNCalendarEvents.saveEvent('Active time ended', {
      calendarId: calendarEventIdEl?.current,
      startDate: dayjs().add(timerRead.workTimeDuration, 's').valueOf(),
      endDate: dayjs().add(timerRead.workTimeDuration + 5, 's').valueOf(),
      alarms: [{
        date: Platform.OS === 'ios' ? -0 : 0
      }],
      timeZone: RNLocalize.getTimeZone(),
    })


    eventIdEl.current = newEventId

    const newIntervalId = setInterval(addToTime, 1000)

    intervalIdEl.current = newIntervalId
  }

 const switchPhase = async (value: 'Play' | 'Break') => {
   try {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     const [timerRead] = timers


     if (timerRead.stopPressed) {
       return
     }

     if (timerRead.isPause) {
       return
     }

     if (value === 'Play') {
       setIsBreak(false)
       setActiveTime(0)

       realm.write(() => {
         const timers = realm.objects<TaskTimer>("TaskTimer")
         if (timers?.length > 0) {
           const timer = timers[0]

           timer.isBreak = false
           timer.stopPressed = false
           timer.activeTime = 0
           timer.breakEpisode -= 1
         }
       })

       if (timerRead.workEpisode > 1) {
         PushNotification.localNotificationSchedule({
           channelId: sub,
           ticker: 'Active time ended',
           bigText: `Active time has ended.
           Break has started. Relax and enjoy the moment.`,
           id: 0,
           title: 'Active time ended',
           message: 'Active time has ended. Break time has started',
           userInfo: {
             type: 'timer',
           },
           number: 10,
           date: dayjs().add(timerRead.workTimeDuration, 's').toDate(),
           allowWhileIdle: true,
         })
       } else {
         PushNotification.localNotificationSchedule({
           channelId: sub,
           ticker: 'Active time ended',
           bigText: `Active time has ended. Good job!`,
           id: 0,
           title: 'Active time ended',
           message: 'Active time has ended.',
           userInfo: {
             type: 'timer',
           },
           number: 10,
           date: dayjs().add(timerRead.workTimeDuration, 's').toDate(),
           allowWhileIdle: true,
         })
       }

       const newEventId = await RNCalendarEvents.saveEvent('Active time ended', {
         calendarId: calendarEventIdEl?.current,
         startDate: dayjs().add(timerRead.workTimeDuration, 's').valueOf(),
         endDate: dayjs().add(timerRead.workTimeDuration + 5, 's').valueOf(),
         alarms: [{
           date: Platform.OS === 'ios' ? -0 : 0
         }],
         timeZone: RNLocalize.getTimeZone(),
       })

       eventIdEl.current = newEventId

       const newIntervalId = setInterval(addToTime, 1000)

       intervalIdEl.current = newIntervalId
     } else {


        setIsBreak(true)
        setActiveTime(0)

        realm.write(() => {
          const timers = realm.objects<TaskTimer>("TaskTimer")

          if (timers && timers.length > 0) {
            const timer = timers[0]
            timer.isBreak = true
            timer.stopPressed = false
            timer.activeTime = 0
            timer.workEpisode -= 1
          }
        })

        PushNotification.localNotificationSchedule({
          channelId: sub,
          ticker: 'Break time ended',
          bigText: `Break time has ended.
          Active time has started. Lets get back to work.`,
          id: 0,
          title: 'Break time ended',
          message: 'Break time has ended. Active time has started',
          userInfo: {
            type: 'timer',
          },
          number: 10,
          date: dayjs().add(timerRead.breakTimeDuration, 's').toDate(),
          allowWhileIdle: true,
        })

        const newEventId = await RNCalendarEvents.saveEvent('Break time ended', {
          calendarId: calendarEventIdEl?.current,
          startDate: dayjs().add(timerRead.breakTimeDuration, 's').valueOf(),
          endDate: dayjs().add(timerRead.breakTimeDuration + 5, 's').valueOf(),
          alarms: [{
            date: Platform.OS === 'android' ? 0 : -0,
          }],
          timeZone: RNLocalize.getTimeZone(),
        })


        eventIdEl.current = newEventId

        const newIntervalId = setInterval(addToTime, 1000)
        intervalIdEl.current = newIntervalId
     }
   } catch(e) {
   }
 }

 const onEndPlay = async () => {
   try {
     setBreakTimeDurationDisplay('')
     setBreakEpisodesDisplay('')
     setWorkEpisodesDisplay('')
     setWorkTimeDurationDisplay('')
     setIsPause(true)

     clearInterval(intervalIdEl.current)

     intervalIdEl.current = -1
     isValidatedEl.current = false
     setIsInitial(true)
     realm.write(() => {
       const timers = realm.objects<TaskTimer>("TaskTimer")

       realm.delete(timers)
     })

     if (eventIdEl?.current) {
       await RNCalendarEvents.removeEvent(eventIdEl?.current)
     }
   } catch(e) {
     
   }
 }

 const onResetPress = () => {
   onEndPlay()
   setIsInitial(true)
 }

 const adjustTime = () => {

   realm.write(() => {
     const timers = realm.objects<TaskTimer>("TaskTimer")

     if (timers?.[0]) {
       const timer = timers[0]

       if (timer.stopPressed) {
         timer.activeTime = 0
         return
       }

       if (timer.isPause) {
         return
       }

       if (timer.startTime === 'null' || !(timer?.startTime)) {
         timer.startTime = dayjs().format()
       }

       const now = dayjs().format()

       const pastTime = timer.startTime

       const secondsElapsed = Math.max(dayjs(now).diff(pastTime, 's'), 1)

       setAccumulatedDuration(secondsElapsed)
       timer.accumulatedDuration = secondsElapsed

       if (!(timer.isBreak)) {


         const pastLastActiveTime = timer.lastActiveTime || now


         const activeSecondsElapsed = Math.min(Math.max(dayjs(now).diff(pastLastActiveTime, 's'), 1), timer.workTimeDuration)


         const prevActiveTime = timer.activeTime || 0


         setActiveTime(prevActiveTime + activeSecondsElapsed)


         timer.activeTime = prevActiveTime + activeSecondsElapsed


         timer.lastActiveTime = now

         const pastLastTotalActiveTime = timer.lastTotalActiveTime || now


         const totalActiveSecondsElapsed = Math.max(dayjs(now).diff(pastLastTotalActiveTime, 's'), 1)


         const prevTotalActiveTime = timer.totalActiveTime || 0


         setTotalActiveTime(prevTotalActiveTime + totalActiveSecondsElapsed)
         timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed


         timer.lastTotalActiveTime = now


       } else {

         const pastLastActiveTime = timer.lastActiveTime || now

         const activeSecondsElapsed = Math.min(Math.max(dayjs(now).diff(pastLastActiveTime, 's'), 1), timer.breakTimeDuration)

         const prevActiveTime = timer.activeTime || 0

         setActiveTime(prevActiveTime + activeSecondsElapsed)
         timer.activeTime = prevActiveTime + activeSecondsElapsed


         timer.lastActiveTime = now

       }

     }
   })

 }

 const addToTime = ()=> {

   const timers = realm.objects<TaskTimer>('TaskTimer')

   if (!(timers?.[0]?.id)) {
     return
   }

   const [timer] = timers

   if (timer.stopPressed) {
     return
   }

   if (timer.isPause) {
     return
   }

   if (timer.workEpisode < 0 || timer.breakEpisode < 0) {
      return onEndPlay()
   }
    if (!(timer.isBreak)) {
      const timers = realm.objects<TaskTimer>('TaskTimer')
      const [timer] = timers
     if (timer.activeTime >= timer.workTimeDuration) {


       if (timer.workEpisode > -1 && timer.breakTimeDuration) {


         setActiveTime(0)
         realm.write(() => {
           const timers = realm.objects<TaskTimer>("TaskTimer")

           if (timers?.[0]?.id) {
             const timer = timers[0]

             timer.activeTime = 0
           }

         })
         clearInterval(intervalIdEl.current)
         intervalIdEl.current = -1
         return switchPhase('Break')
       }
     }
   } else if (timer.isBreak) {
     const timers = realm.objects<TaskTimer>('TaskTimer')
     const [timer] = timers
     if (timer.activeTime >= timer.breakTimeDuration) {

       if (timer.breakEpisode > -1 && timer.workTimeDuration) {

         setActiveTime(0)

         realm.write(() => {
           const timers = realm.objects<TaskTimer>("TaskTimer")

           if (timers?.[0]) {
             const timer = timers[0]

             timer.activeTime = 0
           }

         })
         clearInterval(intervalIdEl?.current)
         intervalIdEl.current = -1

         return switchPhase('Play')
       }
     }
   }

   adjustTime()
 }

 const onPausePress = async () => {
   clearInterval(intervalIdEl?.current)
   setIsPause(true)
   setIsInitial(false)
   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     const [timer] = timers
     timer.isPause = true

   })
   PushNotification.cancelLocalNotifications({id: '0'})
   if (eventIdEl?.current) {
     await RNCalendarEvents.removeEvent(eventIdEl?.current)
   }
 }

 const onResumePress = async () => {
   const timers = realm.objects<TaskTimer>('TaskTimer')

   if (!(timers?.[0]?.id)) {
     return
   }

   const [timer] = timers

   if (timer.isBreak) {


     const remainingTime = timer.breakTimeDuration && (mathjs.chain(timer.breakTimeDuration)
        .subtract(timer.activeTime)
        .done())

      PushNotification.localNotificationSchedule({
        channelId: sub,
        ticker: 'Break time ended',
        bigText: `Break time has ended. Active time has started. Lets get back to work.`,
        id: 0,
        title: 'Break time ended',
        message: 'Break time has ended. Active time has started',
        userInfo: {
          type: 'timer',
        },
        number: 10,
        date: dayjs().add(remainingTime, 's').toDate(),
        allowWhileIdle: true,
      })

      const newEventId = await RNCalendarEvents.saveEvent('Break time ended', {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs().add(remainingTime, 's').valueOf(),
        endDate: dayjs().add(remainingTime + 5, 's').valueOf(),
        alarms: [{
          date: Platform.OS === 'android' ? 0 : -0,
        }],
        timeZone: RNLocalize.getTimeZone(),
      })


      eventIdEl.current = newEventId
  } else if (!(timer.isBreak)) {


     const remainingTime = timer?.workTimeDuration && mathjs.chain(timer.workTimeDuration)
        .subtract(timer.activeTime)
        .done()

    

      if (timer.workEpisode > 1) {
        PushNotification.localNotificationSchedule({
          channelId: sub,
          ticker: 'Active time ended',
          bigText: `Active time has ended. Break has started. Relax and enjoy the moment.`,
          id: 0,
          title: 'Active time ended',
          message: 'Active time has ended. Break time has started',
          userInfo: {
            type: 'timer',
          },
          number: 10,
          date: dayjs().add(remainingTime, 's').toDate(),
          allowWhileIdle: true,
        })
      } else {
        PushNotification.localNotificationSchedule({
          channelId: sub,
          ticker: 'Active time ended',
          bigText: `Active time has ended. Good job!`,
          id: 0,
          title: 'Active time ended',
          message: 'Active time has ended.',
          userInfo: {
            type: 'timer',
          },
          number: 10,
          date: dayjs().add(remainingTime, 's').toDate(),
          allowWhileIdle: true,
        })
      }

      const newEventId = await RNCalendarEvents.saveEvent('Active time ended', {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs().add(timer.workTimeDuration, 's').valueOf(),
        endDate: dayjs().add(timer.workTimeDuration + 5, 's').valueOf(),
        alarms: [{
          date: Platform.OS === 'android' ? 0 : -0,
        }],
        timeZone: RNLocalize.getTimeZone(),
      })

      

      eventIdEl.current = newEventId

  }

   setIsPause(false)

   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     const [timer] = timers

     timer.isPause = false
     timer.lastActiveTime = dayjs().format()
     timer.lastTotalActiveTime = dayjs().format()
   })

   const newIntervalId = setInterval(addToTime, 1000)

   intervalIdEl.current = newIntervalId
 }

 const onValidatePlay = () => {
   const timers = realm.objects<TaskTimer>('TaskTimer')
   if (!(timers?.[0]?.id)) {
   }
   const [timer] = timers
   if (!(timer.workTimeDuration)) {
     Toast.show({
       type: 'error',
       text1: 'No activity duration chosen',
       text2: 'Please choose a length of time to be active'
     })
     setIsForm(true)
     return
   }

   if (timer.workEpisode === 0) {
     Toast.show({
       type: 'error',
       text1: '0 activity episodes',
       text2: 'Please choose atleast 1 episode of activity'
     })
     setIsForm(true)
     return
   }

   if (!(timer.breakTimeDuration) && timer.workEpisode > 1) {
     Toast.show({
       type: 'error',
       text1: 'No break duration chosen',
       text2: 'Please choose a length of time for break'
     })
     setIsForm(true)
     return
   }

   if (timer.breakTimeDuration && timer.breakEpisode < 1) {
     Toast.show({
       type: 'error',
       text1: '0 break episodes',
       text2: 'Please choose atleast 1 episode of break'
     })
     setIsForm(true)
     return
   }

   if (timer.numberOfWorkEpisodes < 1) {
     Toast.show({
       type: 'error',
       text1: 'No activity episode chosen',
       text2: 'Please choose atleast 1 episode of activity'
     })
     setIsForm(true)
     return
   }

   if (timer.numberOfWorkEpisodes > 1 && timer.numberOfBreakEpisodes < 1) {
     Toast.show({
       type: 'error',
       text1: 'No break episode chosen',
       text2: 'Please choose atleast 1 break episode for more than 1 activity episodes'
     })
     setIsForm(true)
     return
   }

   if (((timer.numberOfWorkEpisodes - 1) !== (timer.numberOfBreakEpisodes))
   && (timer.numberOfWorkEpisodes !== (timer.numberOfBreakEpisodes))) {
     Toast.show({
       type: 'error',
       text1: 'Inconsistent breaks and active time',
       text2: 'Break episodes should be equal to active episodes or active episodes - 1',
     })
     setIsForm(true)
     return
   }

   setIsBreak(false)
   setIsInitial(false)
   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     const [timer] = timers

     timer.isBreak = false
     timer.stopPressed = false
   })
   isValidatedEl.current = true
   setIsForm(false)

   switchPhase('Play')

 }

 const onPlayPress = () => {

   setIsPause(false)

   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')
     if (!(timers?.[0]?.id)) {
       realm.create("TaskTimer", {
         id: uuid(),
         startTime: 'null',
         isBreak: false,
         isPause: false,
         stopPressed: false,
       })
       return
     }

     const [timer] = timers
     timer.stopPressed = false
   })

   const timers = realm.objects<TaskTimer>('TaskTimer')

   const [timer] = timers

   if (!(timer?.id)) {
      return
   }

   if (isInitial) {
     return onValidatePlay()
   }


   if (timer.isPause) {
     return onResumePress()
   }

   if (!(isValidatedEl?.current)) {

     setWorkTimeDurationDisplay('')
     setWorkEpisodesDisplay('')
     setBreakTimeDurationDisplay('')
     setWorkEpisodesDisplay('')
     return setIsForm(true)
   }

   if (timer.isBreak) {
     switchPhase('Break')
   } else {
     switchPhase('Play')
   }
 }

 const exitTimer = () => {
   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')
     if (!(timers?.[0]?.id)) {
       return
     }

     const [timer] = timers

     timer.stopPressed = true
     timer.workEpisode = 0
     timer.workTimeDuration = 0
     timer.breakEpisode = 0
     timer.breakTimeDuration = 0
   })

   navigation.navigate('UserTask', { taskType })
 }

 const toggleOverlay = () => setIsForm(!isForm)

 const workTimeChange = (text: string) => {
   const textValue = text.replace(/[^0-9.]/g, '')

   setWorkTimeDurationDisplay(textValue)

   if (parseFloat(textValue) === NaN) {
     return
   }

   if (textValue === '') {
     return
   }

   const numValue = parseFloat(textValue)

   const secondValue = dayjs.duration(numValue, 'm').asSeconds()

   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     timers[0].workTimeDuration = secondValue
   })
 }

 const breakTimeChange = (text: string) => {
   const textValue = text.replace(/[^0-9.]/g, '')

   setBreakTimeDurationDisplay(textValue)

   if (parseFloat(textValue) === NaN) {
     return
   }

   if (textValue === '') {
     return
   }

   const numValue = parseFloat(textValue)

   const secondValue = dayjs.duration(numValue, 'm').asSeconds()

   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }

     timers[0].breakTimeDuration = secondValue
   })
 }

 const workEpisodeChange = (text: string) => {
   const textValue = text.replace(/[^0-9]/g, '')
   setWorkEpisodesDisplay(textValue)

   if (parseFloat(textValue) === NaN) {
     return
   }

   if (textValue === '') {
     return
   }

    const numValue = parseFloat(textValue)



   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }
     timers[0].numberOfWorkEpisodes = numValue
     timers[0].workEpisode = numValue
   })


 }

 const breakEpisodeChange = (text: string) => {
   const textValue = text.replace(/[^0-9]/g, '')
   setBreakEpisodesDisplay(textValue)

   if (parseFloat(textValue) === NaN) {
     return
   }

   if (textValue === '') {
     return
   }

   const numValue = parseFloat(textValue)



   realm.write(() => {
     const timers = realm.objects<TaskTimer>('TaskTimer')

     if (!(timers?.[0]?.id)) {
       return
     }
     timers[0].numberOfBreakEpisodes = numValue
     timers[0].breakEpisode = numValue
   })
 }

 const showMenu = () => setIsMenu(true)

 const hideMenu = () => setIsMenu(false)

 const showForm = () => {
   toggleOverlay()
   hideMenu()
 }

 return (
   <Box flex={1} justifyContent="center">
     <Box flex={0.5} flexDirection="row" justifyContent="flex-end">
       <Menu
         visible={isMenu}
         onDismiss={hideMenu}
         anchor={<Text variant="menuHeader" pr={{ phone: 's', tablet: 'm' }} mr={{ phone: 'm', tablet: 'l' }} onPress={showMenu}>{"\u20DB"}</Text>}
        >
            <Menu.Item title="Edit" onPress={showForm} />
       </Menu>
     </Box>
     <Box flex={1}>
       <Text variant="header">
         Task Timer
       </Text>
     </Box>
     <Box flex={8.5}>
       <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isForm} onBackdropPress={toggleOverlay}>
         <RegularCard>
            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-around">
              <TextField
                type="numeric"
                label="minutes"
                placeholder="0"
                onChangeText={workTimeChange}
                value={workTimeDurationDisplay}
              />
              <Text variant="optionHeader">
                Active Time
              </Text>
              <Text marginHorizontal={{ phone: 's', tablet: 'm' }}>
                X
              </Text>
              <TextField
                type="numeric"
                label="episodes"
                placeholder="1"
                onChangeText={workEpisodeChange}
                value={workEpisodesDisplay}
              />
            </Box>
            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-around">
              <TextField
                type="numeric"
                label="minutes"
                placeholder="0"
                onChangeText={breakTimeChange}
                value={breakTimeDurationDisplay}
              />
              <Text variant="optionHeader">
                Break Time
              </Text>
              <Text marginHorizontal={{ phone: 's', tablet: 'm' }}>
                X
              </Text>
              <TextField
                type="numeric"
                label="episodes"
                placeholder="0"
                onChangeText={breakEpisodeChange}
                value={breakEpisodesDisplay}
              />
            </Box>
            <Box>
              <Button onPress={onInitialStartPlay}>
                Start
              </Button>
            </Box>
         </RegularCard>
       </Overlay>
       <Box flex={1} justifyContent="center">
         <Box alignItems="center" flex={2}>
           {
             !isBreak
              ? (
                <Text variant="subheader">
                  {formatTimer(activeTime)}
                </Text>
             ) : (
               <Text variant="subheader">
                 00:00
               </Text>
             )
           }
         </Box>
         <Box flex={2} flexDirection="row" justifyContent="space-around">
           <Box m={{ phone: 's', tablet: 'm' }}>
             {
               !isPause
                ? (
                  <TouchableOpacity onPress={onPausePress}>
                    <Ionicons name="ios-pause-circle" size={64} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={onPlayPress}>
                    <Ionicons name="ios-play-circle" size={64} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                )
             }
           </Box>
           <Box m={{ phone: 's', tablet: 'm' }}>
             <TouchableOpacity onPress={onResetPress}>
               <Ionicons name="ios-stop-circle" size={64} color={dark ? palette.white : palette.purplePrimary} />
             </TouchableOpacity>
           </Box>
         </Box>
         <Box alignItems="center" justifyContent="center" flex={2} flexDirection="row">
           <Text variant="subheader">
             {'Total Active Time: '}
           </Text>
           <Text variant="subheader">
             {formatTimer(totalActiveTime)}
           </Text>
         </Box>
         <Box alignItems="center" justifyContent="center" flex={2} flexDirection="row">
           <Text variant="subheader">
             {'Overall Time: '}
           </Text>
           <Text variant="subheader">
             {formatTimer(accumulatedDuration)}
           </Text>
         </Box>
         <Box flex={2} alignItems="center" justifyContent="center">
           <Button onPress={exitTimer}>
             Exit
           </Button>
         </Box>
       </Box>
     </Box>
   </Box>
 )
}

export default UserTaskTimer
