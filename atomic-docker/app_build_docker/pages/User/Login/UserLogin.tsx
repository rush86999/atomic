import React, { useState, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import Session1 from "supertokens-web-js/recipe/session"
import dynamic from 'next/dynamic'
import { ThirdPartyEmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/thirdpartyemailpassword/prebuiltui";
import { redirectToAuth } from 'supertokens-auth-react'
import { canHandleRoute, getRoutingComponent } from 'supertokens-auth-react/ui'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
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

    if (session?.getUserId()) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }
}


const SuperTokensComponentNoSSR = dynamic<{}>(
  new Promise((res) => res(() => getRoutingComponent([ThirdPartyEmailPasswordPreBuiltUI]))),
  { ssr: false }
)

 function UserLogin() {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [user, setUser] = useState<any>()
    const [passChallenge, setPassChallenge] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // const dark = useColorScheme() === 'dark'
    const toast = useToast()
    const router = useRouter()
      // check if user already logged in and confirmed
    useEffect(() => {
      async function checkLoggedIn() {
        try {
          
          const userId = await Session1.getUserId()
          if (userId) {
            router.push('/')
          }
        } catch(e) {
          console.log(e, ' unable to auth')
        }
      }
      checkLoggedIn()
    }, [router])

    // if the user visits a page that is not handled by us (like /auth/random), then we redirect them back to the auth page.
    useEffect(() => {
      if (canHandleRoute([ThirdPartyEmailPasswordPreBuiltUI]) === false) { 
        redirectToAuth()
      }
    }, [])


    return (
        <SuperTokensComponentNoSSR />
    )

 }


 export default UserLogin
