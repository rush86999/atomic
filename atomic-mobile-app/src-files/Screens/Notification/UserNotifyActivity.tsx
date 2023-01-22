import React, { useState, useEffect } from 'react'
import {
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native'

import { Icon, Badge } from 'react-native-elements/src'

import { dayjs } from '@app/date-utils'

import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Realm from 'realm'

import { GraphQLResult, API } from '@aws-amplify/api'

import {
  UserProfile,
} from '@models'


import ListActivitiesByUser from '@graphql/Queries/ListActivitiesByUser'

import {
  ListActivitiesByUserQuery,
  ListActivitiesByUserQueryVariables,
} from '@app/API'


import {
  Activity as ActivityRealm
} from '@realm/Activity'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import Box from '@components/common/Box'




type RootNavigationStackParamList = {
  UserViewActivity: undefined,
  UserNotifyActivity: undefined,
}

type UserNotifyActivityNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserNotifyActivity'
>


type Props = {
  sub: string,
  tintColor?: string,
  getRealmApp: () => Realm,
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -16,
    top: -1,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
})

function UserNotifyActivity(props: Props) {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()
  const [newMessages, setNewMessages] = useState<number>(0)

  const {
    tintColor,
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const navigation = useNavigation<UserNotifyActivityNavigationProp>()

  useEffect(() => {
    (async () => {
      try {

        const profiles = realm.objects<UserProfileRealm>('UserProfile')

        if (profiles?.length > 0) {
          setCurrentUserProfile(profiles[0])
        }
      } catch(e) {
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        if (!currentUserProfile || !(currentUserProfile && currentUserProfile.id)) {
          return
        }

        if (!realm) {
          return
        }

        const activityData = await (API
          .graphql({
            query: ListActivitiesByUser,
            variables: {
              userId: currentUserProfile.userId,
              sortDirection: 'DESC',
              limit: 12,
            } as ListActivitiesByUserQueryVariables,
          }) as Promise<GraphQLResult<ListActivitiesByUserQuery>>)

        const {
          data: {
            listActivitiesByUser,
          }
        } = activityData

        if (listActivitiesByUser
        && listActivitiesByUser.items
        && listActivitiesByUser.items.length > 0) {

          const {
            items
          } = listActivitiesByUser


          items.forEach(item => {
            realm.write(() => {
              const activityRealm = realm.objectForPrimaryKey<ActivityRealm>('Activity', item.id)
              if (!activityRealm) {
                realm.create('Activity', {
                  id: item.id,
                  read: false,
                  date: item.date,
                  dateUnix: dayjs(item.date).unix(),
                  senderId: item.senderId,
                  activity: item.activity,
                  objectId: item.objectId,
                  sendername: item.sendername,
                })
                setNewMessages(newMessages + 1)
              } else {
                if (activityRealm.read === false) {
                  setNewMessages(newMessages + 1)
                }
              }
            })
          })
        }
      } catch(e) {
      }
    })()
  }, [(currentUserProfile && currentUserProfile.id), realm])


  useEffect(() => {
    (() => {
    realm.write(() => {
      const activityRealms = realm.objects<ActivityRealm>('Activity')
      activityRealms.forEach(item => {
        if (dayjs().isAfter(dayjs(item.ttl))) {
          realm.delete(item)
        }
      })
    })
    })()
  }, [])

  useEffect(() => {
    return () => {
    }
  }, [])

  const navigateToActivity = () => navigation.navigate('UserViewActivity')

  return (
    <Box>
      <TouchableWithoutFeedback onPress={navigateToActivity}>
        {
          newMessages > 0
          ? (
            <Box style={styles.container}>
              <Icon color={tintColor} type='ionicon' name='notifications' />
              <Badge
                value={newMessages}
                status="error"
                containerStyle={StyleSheet.flatten([
                  styles.badgeContainer,
                ])}
              />
            </Box>
          ) : (
            <Icon color={tintColor} type='ionicon' name='notifications' />
          )
        }
      </TouchableWithoutFeedback>
    </Box>
  )

}


export default UserNotifyActivity
