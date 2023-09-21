import { useRouter } from 'next/router'
import { useEffect, useState } from "react"
import type { NextPage } from 'next'
import { useToast, Spinner } from '@chakra-ui/react'
import { MeetingAssistAttendeeType } from '@lib/dataTypes/MeetingAssistAttendeeType'
import { MeetingAssistType } from '@lib/dataTypes/MeetingAssistType'

import { useAppContext } from '@lib/user-context'
import axios from 'axios'
import qs from 'qs'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
  // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
  // const SSR = withSSRContext({ req })
  // this runs on the backend, so we must call init on supertokens-node SDK
  supertokensNode.init(backendConfig())
  let session
  try {
    session = await Session.getSession(req, res, {
      overrideGlobalClaimValidators: async function () {
        return []
      },
    })
  } catch (err: any) {
    if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
      return { props: { fromSupertokens: 'needs-refresh' } }
    } else if (err.type === Session.Error.UNAUTHORISED) {
      // this will force the frontend to try and refresh which will fail
      // clearing all cookies and redirecting the user to the login screen.
      return { props: { fromSupertokens: 'needs-refresh' } }
    }
    throw err
  }

  if (!session?.getUserId()) {
    return {
      redirect: {
        destination: '/User/Login/UserLogin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      sub: session.getUserId(),
    }
  }
}


const CallbackGoogleOAuth: NextPage = () => {
    const [isValid, setIsValid] = useState<boolean>(true)
    const router = useRouter()
    const toast = useToast()
  

    console.log(router.query, ' router.query')
    // console.log(access_token, ' access_token')

    const error = router.query?.error as string
    
    // validate callback
    useEffect(() => {
        const validateCallback = () => {
            if (error) {
                    toast({
                    title: 'Oops...',
                    description: 'Something went wrong, Google Auth did not work. Maybe try again? Or if it keeps happening let us know.',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                    })
                setIsValid(false)
                return false
            }

            return true

        }

        (() => {
  
            const validatedCallback = validateCallback()

            if (validatedCallback) {
                toast({
                    title: 'Google succesfully authenticate',
                    description: 'Google is successfully authenticated. You can now use Google apps with Atomic',
                    status: 'success',
                    duration: 9000,
                    isClosable: true
                })
                
            }
            
        })()
    }, [error, toast])

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full">
            <div className="sm:text-left lg:my-12 sm:my-8 lg:h-1/6 lg:w-1/2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                    {"Validating your returned values"}
                </h1>

                <p className="mt-1.5 text-sm text-gray-500">
                    {"Please wait as we validate a successful Google authentication"}
                </p>
                <div className="flex justify-center items-center lg:h-5/6 w-full">
                    <Spinner color='pink.500' />
                </div>
                {
                !isValid
                    ? (
                        <p className="mt-1.5 text-sm text-red-500">
                            {"Something went wrong with the Auth!? Go back & try again! "}
                        </p>
                    ) : (
                        <p className="mt-1.5 text-sm text-green-500">
                            {"Google Auth Success. Close me! "}
                        </p>
                    )
                }
            </div>
            
        </div>
    )
}

export default CallbackGoogleOAuth
