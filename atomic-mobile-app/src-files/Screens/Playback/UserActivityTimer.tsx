import React, { useState, useEffect, useRef } from 'react'
import { Appearance } from 'react-native'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import Realm from 'realm'

import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message'
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
import Button from '@components/Button'
import { palette } from '@theme/theme'
import {
  PrimaryGoalType,
} from '@models'

import { formatTimer } from '@utils/time'

import { BackgroundTimer } from '@realm/BackgroundTimer'

const dark = Appearance.getColorScheme() === 'dark'

type RootStackParamList = {
  UserActivityTimer: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string,
    },
  UserAddSkill: {
    totalActiveTime: number,
  },
  UserAddSleep: {
    totalActiveTime: number,
  },
  UserAddMeditation: {
    totalActiveTime: number,
  },
  UserAddExercise: {
    totalActiveTime: number,
  },
  UserAddHabit: {
    totalActiveTime: number,
  },
}


type UserActivityTimerNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserActivityTimer'
>;

type UserActivityTimerRouteProp = RouteProp<
  RootStackParamList,
  'UserActivityTimer'>;

const getRouteScreen = (value: PrimaryGoalType) => {
  switch(value) {
    case PrimaryGoalType.NEWSKILLTYPE:
      return 'UserAddSkill'

    case PrimaryGoalType.MEDITATION:
      return 'UserAddMeditation'

    case PrimaryGoalType.HABITTYPE:
      return 'UserAddHabit'
    default:
      return 'UserAddSkill'
  }
}

const getActivityName = (value: PrimaryGoalType) => {
  switch(value) {
    case PrimaryGoalType.NEWSKILLTYPE:
      return 'skill'
    case PrimaryGoalType.MEDITATION:
      return 'meditation'
    case PrimaryGoalType.HABITTYPE:
      return 'habit'
  }
}

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');



type Props = {

  sub: string,

  route: UserActivityTimerRouteProp,
  getRealmApp: () => Realm,
}


// const config = {
//    schema: [BackgroundTimer.schema],
//    path: "realmData"
// }

// const realm = new Realm(config);

const CALENDARNAME = 'playbackTimer'

function UserActivityTimer(props: Props) {

  const [breakStartTime, setBreakStartTime] = useState<string>('')
  
  const [breakTimeDurationDisplay, setBreakTimeDurationDisplay] = useState<string>('')

  const [breakEpisodesDisplay, setBreakEpisodeDisplay] = useState<string>('')
  const [isBreak, setIsBreak] = useState<boolean>(false)

  const [workStartTime, setWorkStartTime] = useState<string>('')

  const [workTimeDurationDisplay, setWorkTimeDurationDisplay] = useState<string>('')
 
  const [workEpisodesDisplay, setWorkEpisodesDisplay] = useState<string>('')
 
  const [activeTime, setActiveTime] = useState<number>(0)
  
  const [totalActiveTime, setTotalActiveTime] = useState<number>(0)
  const [accumulatedDuration, setAccumulatedDuration] = useState<number>(0)
  const [isForm, setIsForm] = useState<boolean>(true)
  const [isInitial, setIsInitial] = useState<boolean>(true)

  const [isPause, setIsPause] = useState<boolean>(false)

  const [isMenu, setIsMenu] = useState<boolean>(false)

  const calendarEventIdEl = useRef<string>('')
  const eventIdEl = useRef<string>('')
  const breakTimeDurationEl = useRef<number>(0)
  const workTimeDurationEl = useRef<number>(0)
  const intervalIdEl = useRef<number>(0)
  const isValidatedEl = useRef<boolean>(false)
  const breakEpisodeEl = useRef<number>(0)
  const workEpisodeEl = useRef<number>(0)
  const numberOfBreakEpisodesEl = useRef<number>(0)
  const numberOfWorkEpisodesEl = useRef<number>(0)

  const {

    route: {
      params: {
        primaryGoalType,
        secondaryGoalType,
      },
    },
    sub,
 
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const navigation = useNavigation<UserActivityTimerNavigationProp>()

  // get existing Event calendar or create new one
  useEffect(() => {
    (async (): Promise<null | undefined> => {
      const oldStatus = await RNCalendarEvents.checkPermissions()
      let status
      if (oldStatus !== 'authorized') {
        const newStatus = await RNCalendarEvents.requestPermissions()

        status = newStatus
      }

      if (status === 'authorized' || oldStatus === 'authorized') {
        const newCalendars = await RNCalendarEvents.findCalendars();

        const playBackCalendars = newCalendars.filter(each => each.title === CALENDARNAME)

        if (playBackCalendars?.length > 0) {

          calendarEventIdEl.current = playBackCalendars[0].id
          return
        }


        const defaultCalendarSource = Platform.OS === 'ios'
          ? newCalendars?.filter(each => each?.source === 'Default')?.[0]?.source
          : { isLocalAccount: true, name: CALENDARNAME, type: '' }

          const newCalendarId = await RNCalendarEvents.saveCalendar({
            title: 'Timer Calendar',
            color: palette['purple'],
            entityType: 'event',
            source: defaultCalendarSource,
            name: CALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          })


          calendarEventIdEl.current = newCalendarId


      } else {
        Toast.show({
          type: 'error',
          text1: 'Need Calendar Access',
          text2: 'Timer works by setting reminders in your calendar and thus needs access to remind you of breaks and active time'
        })
        // setIsReload(!isReload)
      }
    })();
  }, [])


  // get events and set them if available
  useEffect(() => {

    (async () => {
      if (!calendarEventIdEl?.current) {
        return
      }

      const oldEvents = await RNCalendarEvents.fetchAllEvents(
        dayjs().subtract(1, 'y').format(),
        dayjs().add(1, 'y').format(),
        [calendarEventIdEl?.current],
      )

      if (oldEvents?.length > 0) {

        eventIdEl.current = oldEvents[0].id
      }

    })()
  }, [calendarEventIdEl?.current])

  /** query existing data or create new timer */
  useEffect(() => {
    const getTimer = () => {

      const timers = realm.objects<BackgroundTimer>("BackgroundTimer")
 
       if (timers && timers.length > 0) {
         const timer = timers[0]

         const now = dayjs().format()
         const pastTime = timer.startTime

         const secondsElapsed = dayjs(now).diff(pastTime, 's')

         const prevAccumulatedDuration = timer.accumulatedDuration || 0

         setAccumulatedDuration(prevAccumulatedDuration + secondsElapsed)
         timer.accumulatedDuration = prevAccumulatedDuration + secondsElapsed

         if (!timer.isBreak) {

           // do same for rest
           // activeTime
           const pastLastActiveTime = timer.lastActiveTime || now
           const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')

           const prevActiveTime = timer.activeTime || 0

           setActiveTime(prevActiveTime + activeSecondsElapsed)
           timer.activeTime = prevActiveTime + activeSecondsElapsed

           timer.lastActiveTime = now


           // totalActiveTime
           const pastLastTotalActiveTime = timer.lastTotalActiveTime || now

           const totalActiveSecondsElapsed = dayjs(now).diff(pastLastTotalActiveTime, 's')

           const prevTotalActiveTime = timer.totalActiveTime || 0
           setTotalActiveTime(prevTotalActiveTime + totalActiveSecondsElapsed)
           timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed
           timer.lastTotalActiveTime = now

         } else {
           // during break

           // activeTime
           const pastLastActiveTime = timer.lastActiveTime || now
           const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')

           const prevActiveTime = timer.activeTime || 0

           setActiveTime(prevActiveTime + activeSecondsElapsed)
           timer.activeTime = prevActiveTime + activeSecondsElapsed

           timer.lastActiveTime = now
         }

         const oldTimer = timers[0]

         breakEpisodeEl.current = oldTimer.breakEpisode || 0
         setBreakStartTime(oldTimer.breakStartTime || '')
    
         breakTimeDurationEl.current = oldTimer.breakTimeDuration || 0
        
         numberOfBreakEpisodesEl.current = oldTimer.numberOfBreakEpisodes || 0
         setIsBreak(oldTimer.isBreak || false)
         
         workEpisodeEl.current = oldTimer.workEpisode || 0
         setWorkStartTime(oldTimer.workStartTime || '')
         
         workTimeDurationEl.current = oldTimer.workTimeDuration || 0
         
         numberOfWorkEpisodesEl.current = oldTimer.numberOfWorkEpisodes || 0
         setIsInitial(false)
         setIsForm(false)
         // setIsValidated(true)
         isValidatedEl.current = true
         setTotalActiveTime(oldTimer.totalActiveTime || 0)
         setActiveTime(oldTimer.activeTime || 0)

         if (oldTimer.isBreak) {
           if (secondsElapsed > breakTimeDurationEl?.current) {
             return switchPhase('Play')
           }
           return onResumePress()
         } else {
           if (secondsElapsed > workTimeDurationEl?.current) {
             return switchPhase('Break')
           }

           return onResumePress()
         }
      
       } else {
         // create new BackgroundTimer

         realm.write(() => {
           realm.create("BackgroundTimer", {
             primaryGoalType,
             secondaryGoalType: secondaryGoalType || 'null',
             startTime: 'null',
             isBreak: false,
             isPause: true,
           })
         })
       }


    }
    getTimer()
  }, [])



  /** hit the play button
  in the background play until 1 episode of work or break if user does
  not respond then the cycle breaks but totalDuration continues
  if (breakStartTime === null && workStartTime === null)
  1. start setInterval
  2. add to totalActiveTime
  3. set startTime to null
  4. add to activeTime
  5. subtract 1 to number of workEpisode
  6. set workStartTime
  7. set breakStartTime to null
  8. set isBreak to false
  5. if >= workTimeDuration
    then if ()
    1. clear interval
    2. set activeTime to 0
    3. start setInterval
    4. set isBreak to true
    5. subtract 1 to number of breakEpisode
    6. set workStartTime to null
    7. add to activeTime

   */


 const switchPhase = async (value: 'Play' | 'Break') => {
   if (value === 'Play') {

   
     workEpisodeEl.current = workEpisodeEl?.current - 1
     setWorkStartTime(dayjs().format())

     setBreakStartTime('null')

     setIsBreak(false)

     realm.write(() => {
       const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

       if (timers && timers.length > 0) {
         const timer = timers[0]

         timer.workEpisode = workEpisodeEl?.current - 1
         timer.workStartTime = dayjs().format()
         timer.breakStartTime = 'null'
         timer.isBreak = false
       }

     })

     if (workEpisodeEl?.current > 1) {

       /** add schedule notification */
       PushNotification.localNotificationSchedule({
         channelId: sub,
         ticker: 'Active time ended',
         bigText: `Active time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
         Break has started. Relax and enjoy the moment.`,

         id: 0,
         title: 'Active time ended',
         message: 'Active time has ended. Break time has started',
         userInfo: {
           type: 'timer',
         },
         number: 10,
         date: dayjs().add(workTimeDurationEl?.current, 's').toDate(),
         allowWhileIdle: true,
       })
     } else {
       /** add schedule notification */
       PushNotification.localNotificationSchedule({
         channelId: sub,
         ticker: 'Active time ended',
         bigText: `Active time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
         Good job!`,

         id: 0,
         title: 'Active time ended',
         message: 'Active time has ended.',
         userInfo: {
           type: 'timer',
         },
         number: 10,
         date: dayjs().add(workTimeDurationEl?.current, 's').toDate(),
         allowWhileIdle: true,
       })
     }

     /** create event or reminder  */
     const newEventId = await RNCalendarEvents.saveEvent('Active time ended', {
       calendarId: calendarEventIdEl?.current,
       startDate: dayjs().add(workTimeDurationEl?.current, 's').valueOf(),
       endDate: dayjs().add(workTimeDurationEl?.current + 5, 's').valueOf(),
       alarms: [{
         date: Platform.OS === 'android' ? 0 : -0,
       }],
       timeZone: RNLocalize.getTimeZone(),
     })

    
      eventIdEl.current = newEventId

     const newIntervalId = setInterval(addToTime, 1000)
  
     intervalIdEl.current = newIntervalId

   } else {
      const startTime = dayjs().format()

      breakEpisodeEl.current = breakEpisodeEl?.current - 1
      setBreakStartTime(startTime)
      setWorkStartTime('null')

      setIsBreak(true)

      realm.write(() => {
        const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

        if (timers && timers.length > 0) {
          const timer = timers[0]

          timer.breakEpisode = breakEpisodeEl?.current - 1
          timer.breakStartTime = startTime
          timer.workStartTime = 'null'
          timer.isBreak = true
        }
      })

      /** add schedule notification */
      PushNotification.localNotificationSchedule({
        channelId: sub,
        ticker: 'Break time ended',
        bigText: `Break time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
        Active time has started. Lets get back to work.`,

        id: 0,
        title: 'Break time ended',
        message: 'Break time has ended. Active time has started',
        userInfo: {
          type: 'timer',
        },
        number: 10,
        date: dayjs().add(breakTimeDurationEl?.current, 's').toDate(),
        allowWhileIdle: true,
      })
      const newEventId = await RNCalendarEvents.saveEvent(
        'Break time ended', {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs().add(breakTimeDurationEl?.current, 's').valueOf(),
        endDate: dayjs().add(breakTimeDurationEl?.current + 5, 's').valueOf(),
        alarms: [{
          date: Platform.OS === 'android' ? 0 : -0,
        }],
        timeZone: RNLocalize.getTimeZone(),
      })

     
      eventIdEl.current = newEventId

      const newIntervalId = setInterval(addToTime, 1000)
     
      intervalIdEl.current = newIntervalId
   }
 }

 const onEndPlay = async () => {
 

   // reset data
   setActiveTime(0)
   setTotalActiveTime(0)
   setAccumulatedDuration(0)

   breakEpisodeEl.current = 0
   setBreakStartTime('')
  
   breakTimeDurationEl.current = 0
   
   numberOfBreakEpisodesEl.current = 0
  
   workEpisodeEl.current = 0
   setWorkStartTime('')
 
   workTimeDurationEl.current = 0
  
   numberOfWorkEpisodesEl.current = 0

   intervalIdEl.current = -1

  
   isValidatedEl.current = false
   setIsInitial(true)
 
   realm.write(() => {
     const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

     if (timers && timers.length > 0) {
       const timer = timers[0]
       realm.delete(timer)

     }
   })

   // delete events and reminders
   if (eventIdEl?.current) {
     await RNCalendarEvents.removeEvent(eventIdEl?.current)
   }

 }

 const onResetPress = () => {
   onEndPlay()
   setIsInitial(true)
 }

 const adjustTime = () => {
   /** screen goes off and timer stops so save every second
   and adjust time difference*/

   // create or update timer
   realm.write(() => {
     const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

     if (timers && timers.length > 0) {
       const timer = timers[0]

       if (timer.startTime === 'null' || !timer.startTime) {
         timer.startTime = dayjs().format()
       }

       const now = dayjs().format()
       const pastTime = timer.startTime

       const secondsElapsed = Math.max(dayjs(now).diff(pastTime, 's'), 1)

       const prevAccumulatedDuration = timer.accumulatedDuration || 0

       setAccumulatedDuration(prevAccumulatedDuration + secondsElapsed)
       timer.accumulatedDuration = prevAccumulatedDuration + secondsElapsed

       if (!timer.isBreak) {

         // do same for rest
         // activeTime
         const pastLastActiveTime = timer.lastActiveTime || now
         const activeSecondsElapsed = Math.min(Math.max(dayjs(now).diff(pastLastActiveTime, 's'), 1), workTimeDurationEl?.current)

         const prevActiveTime = timer.activeTime || 0

         setActiveTime(prevActiveTime + activeSecondsElapsed)
         timer.activeTime = prevActiveTime + activeSecondsElapsed

         timer.lastActiveTime = now


         // totalActiveTime
         const pastLastTotalActiveTime = timer.lastTotalActiveTime || now

         const totalActiveSecondsElapsed = Math.max(dayjs(now).diff(pastLastTotalActiveTime, 's'), 1)

         const prevTotalActiveTime = timer.totalActiveTime || 0
         setTotalActiveTime(prevTotalActiveTime + totalActiveSecondsElapsed)
         timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed
         timer.lastTotalActiveTime = now

       } else {
         // during break

         // activeTime
         const pastLastActiveTime = timer.lastActiveTime || now
         const activeSecondsElapsed = Math.min(Math.max(dayjs(now).diff(pastLastActiveTime, 's'), 1), breakTimeDurationEl?.current)

         const prevActiveTime = timer.activeTime || 0

         setActiveTime(prevActiveTime + activeSecondsElapsed)
         timer.activeTime = prevActiveTime + activeSecondsElapsed

         timer.lastActiveTime = now
       }

     }
   })

 }

 const addToTime = ()=> {
   // setActiveTime(activeTime + 1)
   //
   // if (isBreak) {
   //   setTotalActiveTime(totalActiveTime + 1)
   // }
   //
   // setAccumulatedDuration(accumulatedDuration + 1)

   adjustTime()

   if (workEpisodeEl?.current < 0 || breakEpisodeEl?.current < 0) {
      return onEndPlay()
   }
    if (workStartTime) {
     if (activeTime >= workTimeDurationEl?.current) {
       if (workEpisodeEl?.current > -1 && breakTimeDurationEl?.current) {

         setActiveTime(0)
         realm.write(() => {
           const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

           if (timers && timers.length > 0) {
             const timer = timers[0]

             timer.activeTime = 0
           }

         })
         clearInterval(intervalIdEl?.current)
         // setIntervalId(-1)
         intervalIdEl.current = -1
         return switchPhase('Break')
       }
     }
   } else if (breakStartTime) {
     if (activeTime >= breakTimeDurationEl?.current) {

       if (breakEpisodeEl?.current > -1 && workTimeDurationEl?.current) {
         setActiveTime(0)
         realm.write(() => {
           const timers = realm.objects<BackgroundTimer>("BackgroundTimer")

           if (timers && timers.length > 0) {
             const timer = timers[0]

             timer.activeTime = 0
           }

         })
         clearInterval(intervalIdEl?.current)
         // setIntervalId(-1)
         intervalIdEl.current = -1
         return switchPhase('Play')
       }
     }
   }
 }



 // on pause press
 const onPausePress = async () => {
   clearInterval(intervalIdEl?.current)
   setIsPause(true)
   PushNotification.cancelLocalNotifications({id: '0'})
   // delete events and reminders
   if (eventIdEl?.current) {
     await RNCalendarEvents.removeEvent(eventIdEl?.current)
   }
 }

 // on resume press
 const onResumePress = async () => {

const remainingBreakTime = mathjs.chain(breakTimeDurationEl?.current)
    .subtract(activeTime)
    .done()

  const remainingWorkTime = mathjs.chain(workTimeDurationEl?.current)
    .subtract(activeTime)
    .done()
   // add local push notification based on remaining time
   if ((isBreak && remainingBreakTime > 0) || (remainingWorkTime < 0)) {

      if (!isBreak) {
        setIsBreak(true)
      }

     const remainingTime = remainingWorkTime < 0
      ? mathjs.chain(breakTimeDurationEl?.current)
        .add(remainingWorkTime)
        .done()
      : mathjs.chain(breakTimeDurationEl?.current)
        .subtract(activeTime)
        .done()

      /** add schedule notification */
      PushNotification.localNotificationSchedule({
        channelId: sub,
        ticker: 'Break time ended',
        bigText: `Break time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
        Active time has started. Lets get back to work.`,
        // when: dayjs().add(workTimeDuration , 's').valueOf(),
        // usesChronometer: true,
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

      // setEventId(newEventId)
      eventIdEl.current = newEventId

    } else if (!isBreak || remainingBreakTime < 0) {

     if (isBreak) {
       setIsBreak(!isBreak)
     }

     const remainingTime = remainingBreakTime < 0
     ? mathjs.chain(workTimeDurationEl?.current)
        .add(remainingBreakTime)
        .done()
     : mathjs.chain(workTimeDurationEl?.current)
      .subtract(activeTime)
      .done()

      if (workEpisodeEl?.current > 1) {

        /** add schedule notification */
        PushNotification.localNotificationSchedule({
          channelId: sub,
          ticker: 'Active time ended',
          bigText: `Active time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
          Break has started. Relax and enjoy the moment.`,
          // when: dayjs().add(workTimeDuration , 's').valueOf(),
          // usesChronometer: true,
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
        /** add schedule notification */
        PushNotification.localNotificationSchedule({
          channelId: sub,
          ticker: 'Active time ended',
          bigText: `Active time has ended for ${getActivityName(primaryGoalType)} ${secondaryGoalType ? (secondaryGoalType === 'null' ? '' : rescapeUnsafe(secondaryGoalType)) : ''}.
          Good job!`,
          // when: dayjs().add(remainingTime , 's').valueOf(),
          // usesChronometer: true,
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

      /** create event or reminder  */
      const newEventId = await RNCalendarEvents.saveEvent('Active time ended', {
        calendarId: calendarEventIdEl?.current,
        startDate: dayjs().add(workTimeDurationEl?.current, 's').valueOf(),
        endDate: dayjs().add(workTimeDurationEl?.current + 5, 's').valueOf(),
        alarms: [{
          date: Platform.OS === 'android' ? 0 : -0,
        }],
        timeZone: RNLocalize.getTimeZone(),
      })

      eventIdEl.current = newEventId

   }

   setIsPause(false)
   const newIntervalId = setInterval(addToTime, 1000)
   // setIntervalId(newIntervalId)
   intervalIdEl.current = newIntervalId
  }


 const onValidatePlay = () => {
   /** shift validation to form */
   if (!workTimeDurationEl?.current) {
     Toast.show({
       type: 'error',
       text1: 'No activity duration chosen',
       text2: 'Please choose a length of time to be active'
     })
     setIsForm(true)
     return
   }

   if (workEpisodeEl?.current === 0) {
     Toast.show({
       type: 'error',
       text1: '0 activity episodes',
       text2: 'Please choose atleast 1 episode of activity'
     })
     setIsForm(true)
     return
   }

   if (!breakTimeDurationEl?.current && workEpisodeEl?.current > 1) {
     Toast.show({
       type: 'error',
       text1: 'No break duration chosen',
       text2: 'Please choose a length of time for break'
     })
     setIsForm(true)
     return
   }

   if (breakTimeDurationEl?.current && breakEpisodeEl?.current < 1) {
     Toast.show({
       type: 'error',
       text1: '0 break episodes',
       text2: 'Please choose atleast 1 episode of break'
     })
     setIsForm(true)
     return
   }

   if (numberOfWorkEpisodesEl?.current < 1) {
     Toast.show({
       type: 'error',
       text1: 'No activity episode chosen',
       text2: 'Please choose atleast 1 episode of activity'
     })
     setIsForm(true)
     return
   }

   if (numberOfWorkEpisodesEl?.current > 1 && numberOfBreakEpisodesEl?.current < 1) {
     Toast.show({
       type: 'error',
       text1: 'No break episode chosen',
       text2: 'Please choose atleast 1 break episode for more than 1 activity episodes'
     })
     setIsForm(true)
     return
   }

   if ((numberOfWorkEpisodesEl?.current - 1 !== numberOfBreakEpisodesEl?.current)
   && (numberOfWorkEpisodesEl?.current !== numberOfBreakEpisodesEl?.current)) {
     Toast.show({
       type: 'error',
       text1: 'Inconsistent breaks and active time',
       text2: 'Break episodes should be equal to active episodes or active episodes - 1',
     })
     setIsForm(true)
     return
   }

   // setStartTime('null')
   setWorkStartTime(dayjs().format())
   setBreakStartTime('null')
   setIsBreak(false)
   setIsInitial(false)
   // setIsValidated(true)
   isValidatedEl.current = true
   setIsForm(false)

   switchPhase('Play')

   // if (!breakStartTime && !workStartTime) {
   //
   //   initialPlayPress()
   // }
 }


 const onPlayPress = () => {

   if (isInitial) {
     return onValidatePlay()
   }

   if (!isValidatedEl?.current) {
     return setIsForm(true)
   }

   if (isPause) {
     return onResumePress()
   }

   if (isBreak) {
     switchPhase('Break')
   } else {
     switchPhase('Play')
   }
 }

 const addToActivity = () => {

   navigation.navigate(getRouteScreen(primaryGoalType), { totalActiveTime })
 }

 const toggleOverlay = () => setIsForm(!isForm)

 const workTimeChange = (text: string) => {
   const textValue = text.replace(/[^0-9.]/g, '')
   const numValue = parseFloat(textValue)
   setWorkTimeDurationDisplay(textValue)

   const secondValue = dayjs.duration(numValue, 'm').asSeconds()
   // setWorkTimeDuration(secondValue)
   workTimeDurationEl.current = secondValue
 }

 const breakTimeChange = (text: string) => {
   const textValue = text.replace(/[^0-9.]/g, '')
   const numValue = parseFloat(textValue)

   setBreakTimeDurationDisplay(textValue)

   const secondValue = dayjs.duration(numValue, 'm').asSeconds()
   // setBreakTimeDuration(secondValue)
   breakTimeDurationEl.current = secondValue
 }

 const workEpisodeChange = (text: string) => {
   const textValue = text.replace(/[^0-9]/g, '')
   const numValue = parseFloat(textValue)
   // setNumberOfWorkEpisodes(numValue)
   numberOfWorkEpisodesEl.current = numValue
   setWorkEpisodesDisplay(textValue)

 }

 const breakEpisodeChange = (text: string) => {
   const textValue = text.replace(/[^0-9]/g, '')
   const numValue = parseFloat(textValue)
   // setNumberOfBreakEpisodes(numValue)
   numberOfBreakEpisodesEl.current = numValue
   setBreakEpisodeDisplay(textValue)
 }

 const showMenu = () => setIsMenu(true)

 const hideMenu = () => setIsMenu(false)

 const showForm = () => {
   toggleOverlay()
   hideMenu()
 }

 return (
   <Box>
     <Box flexDirection="row" justifyContent="flex-end">
       <Menu
         visible={isMenu}
         onDismiss={hideMenu}
         anchor={<Text variant="optionHeader" onPress={showMenu}>{"\u20DB"}</Text>}
        >
            <Menu.Item title="Edit" onPress={showForm} />
       </Menu>
     </Box>
     <Text variant="header">
       Timer
     </Text>
     <Box>
       <Overlay isVisible={isForm} onBackdropPress={toggleOverlay} overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }}>
         <RegularCard>
            <Box flexDirection="row" justifyContent="center">
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
            <Box flexDirection="row" justifyContent="center">
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
            <Button onPress={onValidatePlay}>
              Start
            </Button>
         </RegularCard>
       </Overlay>
       <Box>
         <Box>
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
         <Box flexDirection="row" justifyContent="center">
           <Box m={{ phone: 's', tablet: 'm' }}>
             {
               !isPause
                ? (
                  <TouchableOpacity onPress={onPlayPress}>
                    <Ionicons name="ios-play-circle" size={36} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={onPausePress}>
                    <Ionicons name="ios-pause-circle" size={36} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                )
             }
           </Box>
           <Box m={{ phone: 's', tablet: 'm' }}>
             <TouchableOpacity onPress={onResetPress}>
               <Ionicons name="ios-stop-circle" size={36} color={dark ? palette.white : palette.purplePrimary} />
             </TouchableOpacity>
           </Box>
         </Box>
         <Box>
         </Box>
         <Box flexDirection="row">
           <Text variant="subheader">
             {'Total Active Time: '}
           </Text>
           <Text variant="subheader">
             {formatTimer(totalActiveTime)}
           </Text>
         </Box>
         <Box flexDirection="row">
           <Text variant="subheader">
             {'Overall Time: '}
           </Text>
           <Text variant="subheader">
             {formatTimer(accumulatedDuration)}
           </Text>
         </Box>
         <Box>
           <Button onPress={addToActivity}>
             Record Active Time
           </Button>
         </Box>
       </Box>
     </Box>
   </Box>
 )

}

export default UserActivityTimer
