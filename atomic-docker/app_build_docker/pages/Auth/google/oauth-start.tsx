import Image from 'next/image'
import type { NextPage } from 'next'

import { googleOAuthAtomicWebAPIStartUrl, googleSignInDarkButton, googleSignInNormalButton } from "@lib/constants"
import { useEffect, useState } from 'react'
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


const GoogleOAuthStart: NextPage = () => {
    const [url, setUrl] = useState('')

    useEffect(() => {
        const makeLink = () => {
            const newUrl = new URL(googleOAuthAtomicWebAPIStartUrl)
            setUrl(newUrl.href)
        }
        makeLink()
    }, [])

    let googleSignInButton = googleSignInNormalButton
    
    if (typeof window !== "undefined") {
        googleSignInButton = window.matchMedia('(prefers-color-scheme: dark)').matches ? googleSignInDarkButton : googleSignInNormalButton
    }
    
    const routeToGoogleCalendarSignIn = (e: { preventDefault: () => void }) => {
        e?.preventDefault()
        const newUrl = new URL(googleOAuthAtomicWebAPIStartUrl)
        window.location.href = newUrl.href
        
    }


    return (
        <div className="flex flex-col justify-center items-center h-full w-full" style={{ minHeight: '70vh'}}>
            <div className=" lg:my-12 sm:my-8 lg:h-1/6 sm:w-1/2">
                <h1 className="text-xl font-bold text-center  text-gray-900 dark:text-gray-200 sm:text-2xl">
                    {"Sign in to your Google Account"}
                </h1>

                <p className="mt-1.5 text-sm text-center text-gray-500">
                    {"Sign in to your Google calendar to sync events and avoid conflict 😊 "}
                </p>
            </div>
            <div className="flex flex-col justify-start items-center lg:h-5/6">
                <div>
                    <a href={url} onClick={routeToGoogleCalendarSignIn}>
                        <Image
                            src={googleSignInButton}
                            alt="Google Sign In"
                            width={382}
                            height={92}
                            className="rounded"
                        />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default GoogleOAuthStart
