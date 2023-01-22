import React, { useState, useEffect, useRef } from 'react'
import { Pressable, Appearance } from 'react-native'
import { dayjs } from '@app/date-utils'
import Realm from 'realm'
import { v4 as uuid } from 'uuid'
import PushNotification from 'react-native-push-notification'
import { TouchableOpacity } from 'react-native'

import { Menu } from 'react-native-paper'
import { Overlay } from 'react-native-elements/src'
import { TextField, Toast as ToastTimer } from 'react-native-ui-lib'
import Toast from 'react-native-toast-message'
import * as mathjs from 'mathjs'

import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import Button from '@components/Button'

import { palette } from '@theme/theme'


import { formatTimer } from '@utils/time'
import { ExerciseTimer } from '@realm/ExerciseTimer'


// store in this state using anonymous function call
type onAccumulatedDuration = (value: string) => void

  type Props = {
    sub: string,
    numberOfBreakEpisodes?: number,
    // breakTriggerFn: (triggerBreak: triggerBreak) => void
    onAccumulatedDuration?: onAccumulatedDuration,
    getRealmApp: () => Realm,
  }

  // const config = {
  //    schema: [ExerciseTimer.schema],
  //    path: "realmData"
  // }
  //
  // const realm = new Realm(config);
  const dark = Appearance.getColorScheme() === 'dark'

  function UserExerciseTimer(props: Props) {

    const [breakTimeDurationDisplay, setBreakTimeDurationDisplay] = useState<string>('')
    const [isBreak, setIsBreak] = useState<boolean>(false)
   
    const [activeTime, setActiveTime] = useState<string>("0")
    const [totalActiveTime, setTotalActiveTime] = useState<string>("0")
    const [accumulatedDuration, setAccumulatedDuration] = useState<string>("0")
    const [isForm, setIsForm] = useState<boolean>(false)
   
    const [isInitial, setIsInitial] = useState<boolean>(true)
   
    const [isPause, setIsPause] = useState<boolean>(true)
    const [isMenu, setIsMenu] = useState<boolean>(false)
   
    const intervalIdEl = useRef<number>(0)
    const isValidatedEl = useRef<boolean>(false)

    const {
      numberOfBreakEpisodes: parentBreakEpisodes,
      sub,
      onAccumulatedDuration,
      getRealmApp,
    } = props

    const [breakEpisodesDisplay, setBreakEpisodesDisplay] = useState<string>(`${parentBreakEpisodes}` || '')

    const realm = getRealmApp()

    /** query existing data or create new timer */
    useEffect(() => {
      const getTimer = () => {
        if (!realm) {
          return
        }
        /**
        1. calculate seconds of accumulatedDuration
        2. set accumulatedDuration
        3. set startTime to null*/
        realm.write(() => {
          const timers = realm.objects<ExerciseTimer>("ExerciseTimer")

          if (timers?.[0]?.startTime) {
            const [timer] = timers

            if (timer.startTime === 'null') {
              return
            }

            if (timer.stopPressed) {
              // 
              return
            }

            const now = dayjs().format()

            const pastTime = timer.startTime

            const secondsElapsed = dayjs(now).diff(pastTime, 's')

            const prevAccumulatedDuration = timer.accumulatedDuration || 0

            setAccumulatedDuration(`${prevAccumulatedDuration + secondsElapsed}`)
            if (onAccumulatedDuration) {
              onAccumulatedDuration(`${mathjs.chain(dayjs.duration(prevAccumulatedDuration + secondsElapsed).asMinutes()).format({notation: 'fixed', precision: 0}).done()}`)
            }

            timer.accumulatedDuration = prevAccumulatedDuration + secondsElapsed

            if (!(timer?.isBreak)) {

              // do same for rest
              // activeTime
              const pastLastActiveTime = timer.lastActiveTime || now

              // 

              const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')

              // 

              const prevActiveTime = timer.activeTime || 0

              // 

              setActiveTime(`${prevActiveTime + activeSecondsElapsed}`)
              timer.activeTime = prevActiveTime + activeSecondsElapsed

              // 

              timer.lastActiveTime = now

              // 

              // totalActiveTime
              const pastLastTotalActiveTime = timer.lastTotalActiveTime || now

              // 

              const totalActiveSecondsElapsed = dayjs(now).diff(pastLastTotalActiveTime, 's')

              // 

              const prevTotalActiveTime = timer.totalActiveTime || 0
              setTotalActiveTime(`${prevTotalActiveTime + totalActiveSecondsElapsed}`)
              // 
              timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed

              // 

              timer.lastTotalActiveTime = now

              // 

            } else {

              const pastLastActiveTime = timer.lastActiveTime || now
              const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')
              const prevActiveTime = timer.activeTime || 0
              timer.activeTime = prevActiveTime + activeSecondsElapsed
              timer.lastActiveTime = now

            }

            const oldTimer = timers[0]
            
            setIsInitial(false)
            setIsForm(false)

            isValidatedEl.current = true
            setTotalActiveTime(`${oldTimer.totalActiveTime || 0}`)

            setActiveTime(`${oldTimer.activeTime || 0}`)

            if (oldTimer.isBreak) {
              if (secondsElapsed > timer.breakTimeDuration) {
                return switchPhase('Play')
              }
              return onResumePress()
            } else {

              return onResumePress()
            }

          } else {
            realm.create("ExerciseTimer", {
              // taskId,
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
    }, [])

    // exit timer
    useEffect(() => () => {
      exitTimer()
    }, [])

    const onInitialStartPlay = async () => {
      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')
      if (!(timers?.[0]?.id)) {
        // 
        realm.write(() => {
          realm.create<ExerciseTimer>("ExerciseTimer", {
            // taskId,
            id: uuid(),
            startTime: 'null',
            isBreak: false,
            isPause: false,
            stopPressed: false,
            breakEpisode: parseInt(breakEpisodesDisplay, 10),
            accumulatedDuration: 0,
            totalActiveTime: 0,
            activeTime: 0,
            lastActiveTime: '',
            lastTotalActiveTime: '',
            numberOfBreakEpisodes: 0,
            breakTimeDuration: dayjs.duration(parseInt(breakTimeDurationDisplay, 10), 'm').asSeconds(),
          })
        })
      }

      const [timer] = timers

      if ((parseInt(breakTimeDurationDisplay, 10) > -1) && parseInt(breakEpisodesDisplay, 10) < 1) {
        Toast.show({
          type: 'error',
          text1: '0 break episodes',
          text2: 'Please choose atleast 1 episode of break'
        })
        setIsForm(true)
        return
      }

      setIsBreak(false)
      setIsInitial(false)
      setActiveTime("0")
      setIsPause(false)
      // setIsValidated(true)
      isValidatedEl.current = true
      setIsForm(false)

      setAccumulatedDuration("0")
      if (onAccumulatedDuration) {
        onAccumulatedDuration("0")
      }


      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          // 
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
      /** create event  */

      // 

      const newIntervalId = setInterval(addToTime, 1000)

      // 
      // setIntervalId(newIntervalId)
      intervalIdEl.current = newIntervalId
    }

    const switchPhase = async (value: 'Play' | 'Break') => {
      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

      if (!(timers?.[0]?.id)) {
        // 
        return
      }

      const [timer] = timers

      // 

      if (timer.stopPressed) {
        // 
        return
      }

      if (timer.isPause) {
        // 
        return
      }

      if (value === 'Play') {
        // 
        
        setIsBreak(false)
        setActiveTime("0")

        realm.write(() => {
          const timers = realm.objects<ExerciseTimer>("ExerciseTimer")
          if (timers?.length > 0) {
            const timer = timers[0]

            timer.isBreak = false
            timer.stopPressed = false
            timer.activeTime = 0
            timer.breakEpisode -= 1
            timer.lastActiveTime = dayjs().format()
            
          }
        })

        // const newIntervalId = setInterval(addToTime, 1000)

        // intervalIdEl.current = newIntervalId
      } else {

        // 

         setIsBreak(true)
         setActiveTime("0")

         realm.write(() => {
           const timers = realm.objects<ExerciseTimer>("ExerciseTimer")

           if (timers && timers.length > 0) {
             const timer = timers[0]

             timer.isBreak = true
             timer.stopPressed = false
             timer.activeTime = 0
             timer.lastActiveTime = dayjs().format()
           }
         })

         /** add schedule notification */
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
           date: dayjs().add(timer.breakTimeDuration, 's').toDate(),
           allowWhileIdle: true,
         })

      }
    }

    const onEndPlay = async () => {
      setBreakTimeDurationDisplay('')
      // breakTimeDurationEl.current = 0
      setBreakEpisodesDisplay('')

      setIsPause(true)

      setIsBreak(false)

      clearInterval(intervalIdEl.current)

      intervalIdEl.current = -1
      // setIsValidated(false)
      isValidatedEl.current = false
      setIsInitial(true)

      // delete timer
      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>("ExerciseTimer")

        if (timers && timers.length > 0) {
          const timer = timers[0]
          realm.delete(timer)
          // setTimerData(null)
        }
      })
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
        const timers = realm.objects<ExerciseTimer>("ExerciseTimer")

        if (timers?.[0]?.id) {
          const timer = timers[0]

          if (timer.stopPressed) {
            
            timer.activeTime = 0
            return
          }

          if (timer.isPause) {
            
            if (timer.startTime === 'null' || !(timer?.startTime)) {
              
              timer.startTime = dayjs().format()
            }

            const now = dayjs().format()
            // 

            const pastTime = timer.startTime
            // 

            const secondsElapsed = dayjs(now).diff(pastTime, 's')

            setAccumulatedDuration(`${secondsElapsed}`)
            if (onAccumulatedDuration) {
              onAccumulatedDuration(`${mathjs.chain(dayjs.duration(secondsElapsed).asMinutes()).format({notation: 'fixed', precision: 0}).done()}`)
            }

            timer.accumulatedDuration = secondsElapsed
            return
          }

          if (timer.startTime === 'null' || !(timer?.startTime)) {
            timer.startTime = dayjs().format()
          }

          const now = dayjs().format()
          // 

          const pastTime = timer.startTime
          // 

          const secondsElapsed = dayjs(now).diff(pastTime, 's')

          setAccumulatedDuration(`${secondsElapsed}`)
          if (onAccumulatedDuration) {
            onAccumulatedDuration(`${mathjs.chain(dayjs.duration(secondsElapsed).asMinutes()).format({notation: 'fixed', precision: 0}).done()}`)
          }
          timer.accumulatedDuration = secondsElapsed

          if (!(timer.isBreak)) {

            // activeTime
            const pastLastActiveTime = timer.lastActiveTime || now

            

            const activeSecondsElapsed = dayjs(now).diff(pastLastActiveTime, 's')

            

            const prevActiveTime = timer.activeTime || 0

            

            setActiveTime(`${prevActiveTime + activeSecondsElapsed}`)

            

            

            timer.activeTime = prevActiveTime + activeSecondsElapsed

            

            timer.lastActiveTime = now

            
            // totalActiveTime
            // date when total active time was calculated last time
            const pastLastTotalActiveTime = timer.lastTotalActiveTime || now

            

            const totalActiveSecondsElapsed = dayjs(now).diff(pastLastTotalActiveTime, 's')

            

            const prevTotalActiveTime = timer.totalActiveTime || 0

            

            setTotalActiveTime(`${prevTotalActiveTime + totalActiveSecondsElapsed}`)
            timer.totalActiveTime = prevTotalActiveTime + totalActiveSecondsElapsed

            

            timer.lastTotalActiveTime = now

            

          } else {
            // during break

            // activeTime
            const pastLastActiveTime = timer.lastActiveTime || now
            // 

            const activeSecondsElapsed = Math.min(dayjs(now).diff(pastLastActiveTime, 's'), timer.breakTimeDuration)
            // 

            const prevActiveTime = timer.activeTime || 0
            // 

            setActiveTime(`${prevActiveTime + activeSecondsElapsed}`)
            timer.activeTime = prevActiveTime + activeSecondsElapsed

            // 

            timer.lastActiveTime = now

            // 
          }

        }
      })

    }

    const addToTime = ()=> {

      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

      if (!(timers?.[0]?.id)) {
        // 
        return
      }

      const [timer] = timers

      if (timer.stopPressed) {
        // 
        return
      }

      // if (timer.isPause) {
      //   
      //   return
      // }

      if (timer.breakEpisode < 0) {
         // 
         return onEndPlay()
      }

      if (timer.isBreak) {
        // 
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')
        const [timer] = timers
        
        if (timer.activeTime >= timer.breakTimeDuration) {
          

          if (timer.breakEpisode > -1) {
            

            setActiveTime("0")

            realm.write(() => {
              const timers = realm.objects<ExerciseTimer>("ExerciseTimer")
              

              if (timers?.[0]) {
                const timer = timers[0]

                timer.activeTime = 0
              }

            })
            // clearInterval(intervalIdEl?.current)
            // setIntervalId(-1)
            // intervalIdEl.current = -1
            // breakEpisodeEl.current -= 1

            // 
            return switchPhase('Play')
          }
        }

      }

      adjustTime()
    }

   

    // on pause press
    const onPausePress = async () => {
      // clearInterval(intervalIdEl?.current)
      setIsPause(true)
      setIsInitial(false)
      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          
          return
        }

        const [timer] = timers
        timer.isPause = true

      })
      PushNotification.cancelLocalNotifications({id: '0'})

    }

    // on resume press
    const onResumePress = async () => {
      // 
      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

      if (!(timers?.[0]?.id)) {
        // 
        return
      }

      const [timer] = timers

      if (timer.isBreak) {

        // 

        const remainingTime = timer.breakTimeDuration && (mathjs.chain(timer.breakTimeDuration)
           .subtract(timer.activeTime)
           .done())
        //
        // 

         /** add schedule notification */
         PushNotification.localNotificationSchedule({
           channelId: sub,
           ticker: 'Break time ended',
           bigText: `Break time has ended. Active time has started. Lets get back to work.`,
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

      }

      setIsPause(false)

      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          return
        }

        const [timer] = timers

        timer.isPause = false
        timer.lastActiveTime = dayjs().format()
        timer.lastTotalActiveTime = dayjs().format()
      })

     }

    const onValidatePlay = () => {
      // 
      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')
      if (!(timers?.[0]?.id)) {
        // 
      }

      setIsBreak(false)
      setIsInitial(false)
      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          // 
          return
        }

        const [timer] = timers

        timer.isBreak = false
        timer.stopPressed = false
      })
      // setIsValidated(true)
      isValidatedEl.current = true
      setIsForm(false)

      switchPhase('Play')

    }

    const onPlayPress = () => {

      // stopPressedEl.current = false
      setIsPause(false)

      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')
        if (!(timers?.[0]?.id)) {
          
          realm.create("ExerciseTimer", {
            // taskId,
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

      const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

      const [timer] = timers

      if (!(timer?.id)) {
         // 
         return
      }

      if (isInitial) {
        
        return onValidatePlay()
      }

      // 

      if (timer.isPause) {
        return onResumePress()
      }

      if (!(isValidatedEl?.current)) {

        setBreakTimeDurationDisplay('')
        return setIsForm(true)
      }

      if (timer.isBreak) {
        switchPhase('Break')
      } else {
        switchPhase('Play')
      }
    }

    const exitTimer = () => {
      // stopPressedEl.current = true
      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')
        if (!(timers?.[0]?.id)) {
          // 
          return
        }

        const [timer] = timers

        timer.stopPressed = true
        timer.breakEpisode = 0
        timer.breakTimeDuration = 0
      })
    }

    const toggleOverlay = () => setIsForm(!isForm)

    const breakTimeChange = (text: string) => {
      const textValue = text.replace(/[^0-9.]/g, '')

      setBreakTimeDurationDisplay(textValue)

      if (parseInt(textValue, 10) === NaN) {
        return
      }

      if (textValue === '') {
        return
      }

      const numValue = parseInt(textValue, 10)

      const secondValue = dayjs.duration(numValue, 'm').asSeconds()

      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          
          return
        }

        const [timer] = timers

        timer.breakTimeDuration = secondValue
        
      })
    }

    const breakEpisodeChange = (text: string) => {
      const textValue = text.replace(/[^0-9]/g, '')
      setBreakEpisodesDisplay(textValue)

      if (parseInt(textValue, 10) === NaN) {
        return
      }

      if (textValue === '') {
        return
      }

      const numValue = parseInt(textValue, 10)

      // 


      realm.write(() => {
        const timers = realm.objects<ExerciseTimer>('ExerciseTimer')

        if (!(timers?.[0]?.id)) {
          // 
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

    const triggerBreak = () => switchPhase('Break')

    const triggerPlay = () => switchPhase('Play')

  

    return (
      <Box style={{ width: '100%'}} flex={1} justifyContent="center" alignItems="center">
        <Box style={{ width: '100%'}} flexDirection="row" justifyContent="flex-end">
          <Menu
            visible={isMenu}
            onDismiss={hideMenu}
            anchor={(
              <Pressable hitSlop={40} onPress={showMenu}>
                <Text variant="header" pr={{ phone: 's', tablet: 'm' }} mr={{ phone: 'm', tablet: 'l' }}>{"\u20DB"}</Text>
              </Pressable>
            )}
           >
               <Menu.Item title="Edit" onPress={showForm} />
          </Menu>
        </Box>
        <Box>
          <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isForm} onBackdropPress={toggleOverlay}>
            <RegularCard>
              <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-around" alignItems="center">
                <TextField
                  type="numeric"
                  title="minutes"
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
                  title="episodes"
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
        </Box>
        <Box flex={1} style={{ width: '100%'}} flexDirection="row" justifyContent="space-around" alignItems="center">
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
          {!isBreak ? (
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <TouchableOpacity onPress={triggerBreak}>
                  <MaterialIcons name="work" size={64} color={dark ? palette.white : palette.purplePrimary} />
                </TouchableOpacity>
              </Box>
            ) : (
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <TouchableOpacity onPress={triggerPlay}>
                <AntDesign name="rest" size={64} color={dark ? palette.white : palette.purplePrimary} />
              </TouchableOpacity>
            </Box>
          )}
          <Box m={{ phone: 's', tablet: 'm' }}>
            <TouchableOpacity onPress={onResetPress}>
              <Ionicons name="ios-stop-circle" size={64} color={dark ? palette.white : palette.purplePrimary} />
            </TouchableOpacity>
          </Box>
        </Box>
        {isBreak ? (
          <ToastTimer
            visible={isBreak}
            position="top"
            backgroundColor={palette.greenPrimary}
            message={`Break time: ${formatTimer(parseInt(activeTime, 10))}`}
          />
        ) : (
          <ToastTimer
            visible={((isValidatedEl.current) && !!activeTime)}
            backgroundColor={palette.greenPrimary}
            message={` Active Time: ${formatTimer(parseInt(activeTime, 10))}`}
          />
        )}
        <ToastTimer
          visible={((isValidatedEl.current) && !!accumulatedDuration)}
          position="bottom"
          backgroundColor={palette.greenPrimary}
          message={` Overall Time: ${formatTimer(parseInt(accumulatedDuration, 10))}`}
        />
      </Box>
    )
  }

  export default UserExerciseTimer
