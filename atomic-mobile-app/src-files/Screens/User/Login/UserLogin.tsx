import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Linking,
  Button as Button2,
  Pressable,
  TouchableOpacity,
  useColorScheme,
 } from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import { TextField } from 'react-native-ui-lib'


import { GraphQLResult, API } from '@aws-amplify/api'
import { CognitoHostedUIIdentityProvider, Auth } from '@aws-amplify/auth'
import Toast from 'react-native-toast-message'
import {
  useNavigation,
 } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'
import SIZES from '@theme/sizes'
import Icon from 'react-native-vector-icons/FontAwesome'

import ListUsersBySub from '@graphql/Queries/ListUsersBySub'

import {
  ListUsersBySubQuery,
  ListUsersBySubQueryVariables,
} from '@app/API'

import {
  User as UserRealm,
} from '@realm/User'


 type RootNavigationStackParamList = {
   UserLogin: undefined,
   UserForgotPassword: undefined,
   UserChangePassword: undefined,
   UserCompleteRegister: undefined,
   UserAlternateCompleteRegister: undefined,
   UserInitialRegister: undefined,
 }

 type UserLoginNavigationProp = StackNavigationProp<
   RootNavigationStackParamList,
   'UserLogin'
 >

 type Props = {
   checkUserConfirmed: () => Promise<boolean>,
   getRealmApp: () => Realm,
   setUserConfirmed: Dispatch<SetStateAction<boolean>>,
 }

 function UserLogin(props: Props) {
   const [email, setEmail] = useState<string>('')
   const [password, setPassword] = useState<string>('')
   const [user, setUser] = useState<any>()
   const [passChallenge, setPassChallenge] = useState<string>('')

    const dark = useColorScheme() === 'dark'
    const height = useHeaderHeight()

   const {
     checkUserConfirmed,
     getRealmApp,
   } = props
   const setUserConfirmed = props?.setUserConfirmed

   useEffect(() => {
    async function checkLoggedIn() {
      try {
        if (!Auth) {
          return
        }
        const { payload: { sub } } = (await Auth?.currentSession())?.getIdToken()
        if (sub) {
          const isConfirmed = await  checkUserConfirmed()
          if (isConfirmed) {
            setUserConfirmed(isConfirmed || false)
          }
        }
      } catch(e) {
        
      }
    }
    checkLoggedIn()
  }, [])

   const realm = getRealmApp()

   const navigation = useNavigation<UserLoginNavigationProp>()
  

   const createExistingRealmUser = async () => {

        try {
          const { payload: { sub } } = (await Auth.currentSession()).getIdToken()

          const userData = await API.
            graphql({
              query: ListUsersBySub,
              variables: {
                sub,
                limit: 1,
              } as ListUsersBySubQueryVariables
            }) as GraphQLResult<ListUsersBySubQuery>

          const listUsersBySub = userData?.data?.listUsersBySub?.items?.[0]


          if (listUsersBySub?.id) {

            realm.write(async () => {
              realm.create<UserRealm>('User', {
                id: 1,
                sub,
                email: listUsersBySub?.email,
                isNew: false,
              })

              const isConfirmed = await checkUserConfirmed()
              if (isConfirmed) {
                setUserConfirmed(isConfirmed || false)
              }
            })

          }

        } catch(e) {
          
        }
   }

   const onEmailChange = (value: string) => setEmail(value)

   const onPasswordChange = (value: string) => setPassword(value)

   const onSignIn = async () => {
     let userObject = null
     if (!email) {
       Toast.show({
         type: 'error',
         text1: 'Email empty',
         text2: 'Email cannot be empty'
       })
       return
     }

     if (!password) {
       Toast.show({
         type: 'error',
         text1: 'Password empty',
         text2: 'Password cannot be empty'
       })
       return
     }
     try  {
       const user = await Auth.signIn(email, password)


       if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
         setUser(user)
       } else {
         userObject = realm.objectForPrimaryKey<UserRealm>('User', 1)
         if (userObject?.isNew) {
           return navigation.navigate('UserCompleteRegister')
         }
         const isConfirmed = await checkUserConfirmed()
         
         if (isConfirmed) {
           setUserConfirmed(isConfirmed || false)
         } else {
            navigation.navigate('UserAlternateCompleteRegister')
         }
         
         return
       }
     } catch(e: any) {
       
       if (e.code === 'UserNotConfirmedException') {
        await Auth.resendSignUp(email)
        Toast.show({
          type: 'info',
          text1: 'You are not confirmed',
          text2: 'Code has been resent for confirmation'
        })
        return
      }

      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: `${e.message}`
      })
     }

     if (!userObject) {
       await createExistingRealmUser()
     }

     const isConfirmed = await checkUserConfirmed()
     
     if (isConfirmed) {
       setUserConfirmed(isConfirmed || false)
     }
   }

   const onNewPasswordRequired = async () => {
     try {
       await Auth.completeNewPassword(
         user,
         passChallenge,
         {
           email,
         }
       )
       const isConfirmed = await checkUserConfirmed()
       if (isConfirmed) {
         setUserConfirmed(isConfirmed || false)
       }
     } catch(e) {
       Toast.show({
         type: 'error',
         text1: 'Could not confirm',
         text2: 'Unable to confirm new challenge password'
       })
     }
   }

   const navigateToForgotPass = () => navigation.navigate('UserForgotPassword')

   const navigateToRegister = () => navigation.navigate('UserInitialRegister')

   

   if (user?.challengeName === 'NEW_PASSWORD_REQUIRED') {
     return (
       <Box flex={1} justifyContent="space-around" alignItems="center">
         <KeyboardAvoidingView
            keyboardVerticalOffset={height + 64}
            behavior={Platform.OS == "ios" ? "padding" : "height"}
          >
            <TextField
              title="New Password Challenge"
              value={passChallenge}
              onChangeText={setPassChallenge}
            />
            <Box mt={{ phone: 'm', tablet: 'l' }}>
              <Button onPress={onNewPasswordRequired}>
                Login with New Password
              </Button>
            </Box>
          </KeyboardAvoidingView>
        </Box>
     )
   }

   return (
     <Box flex={1} justifyContent="center" alignItems="center">
       <KeyboardAvoidingView
          keyboardVerticalOffset={height + 64}
          behavior={Platform.OS == "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
         <Box justifyContent="space-around" alignItems="center">
           <Box m={{ phone: 'm' , tablet: 'l' }}>
             <TextField
                title="Email"
                value={email}
                onChangeText={onEmailChange}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                autoCorrect={false}
             />
             <TextField
               title="Password"
               secureTextEntry
               value={password}
               onChangeText={onPasswordChange}
               autoCapitalize='none'
               autoCorrect={false}
             />
             <Box flexDirection="row" justifyContent="flex-start">
               <Text variant="buttonLink" onPress={navigateToForgotPass}>
                 Forgot Password?
               </Text>
             </Box>
           </Box>
           <Button onPress={onSignIn}>
             Log in
           </Button>
           <Box m={{ phone: 'm', tablet: 'l' }} flexDirection="row" justifyContent="center" alignItems="center">
             <Text variant="optionHeader">
               Don't have an account?
             </Text>
             <Text variant="optionHeader">
               {' '}
             </Text>
             <Text variant="buttonLink" onPress={navigateToRegister}>
               Sign up!
             </Text>
           </Box>
         </Box>
         <Box justifyContent="space-around" alignItems="center">
           <Box mt={{ phone: 's', tablet: 'm' }}>
             <Pressable
               style={{
                 backgroundColor: '#DB4437',
                 borderWidth: 0,
                 borderRadius: SIZES.BASE * 2,
                 width: 275,
                 height: 44,
                 justifyContent: 'center', flexDirection: 'row', alignItems: 'center',
               }}
               onPress={() => {

                 Auth.federatedSignIn({
                   provider: CognitoHostedUIIdentityProvider.Google,
                  })
                }}
             >
               <TouchableOpacity onPress={() => {

                 Auth.federatedSignIn({
                   provider: CognitoHostedUIIdentityProvider.Google,
                 })
              }} style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                 <Box flex={1} flexDirection="row" justifyContent="center" alignItems="center">
                   <Icon
                     name="google"
                     size={19}
                     color={palette.white}
                     style={{ marginRight: 22 }}
                   />
                   <Text variant="google">
                     Sign in with Google
                   </Text>
                 </Box>
             </TouchableOpacity>
             </Pressable>
           </Box>
           <Box mt={{ phone: 's', tablet: 'm' }}>
             <Pressable
               style={{
                 backgroundColor: dark ? palette.white : palette.black,
                 borderWidth: 0,
                 borderRadius: SIZES.BASE * 2,
                 width: 275,
                 height: 44,
                 justifyContent: 'center', flexDirection: 'row', alignItems: 'center',
               }}
               onPress={() => {

                 Auth.federatedSignIn({
                   provider: CognitoHostedUIIdentityProvider.Apple,
                })
              }}
             >
               <TouchableOpacity onPress={() => {

                 Auth.federatedSignIn({
                   provider: CognitoHostedUIIdentityProvider.Apple,
                 })
              }} style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                 <Box flex={1} flexDirection="row" justifyContent="center" alignItems="center">
                   <Icon
                     name="apple"
                     size={19}
                     color={dark ? palette.black : palette.white}
                     style={{ marginRight: 22 }}
                   />
                   <Text variant="apple">
                     Sign in with Apple
                   </Text>
                 </Box>
               </TouchableOpacity>
             </Pressable>
           </Box>
         </Box>
       </KeyboardAvoidingView>
     </Box>
   )

 }

 export default UserLogin
