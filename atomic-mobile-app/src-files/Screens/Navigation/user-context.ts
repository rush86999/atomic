import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import React, { Dispatch, SetStateAction } from 'react'

const placeholder = ''

const client: ApolloClient<NormalizedCacheObject> | null = null

const checkUserPlaceholder = async (): Promise<boolean> => new Promise(
  (resolve) => resolve(false)
)

type setUserConfirmedType = Dispatch<SetStateAction<boolean>>

const setUserConfirmed: setUserConfirmedType = (): void => undefined


function getRealmPlaceholder(): any {
  return undefined
}

export default React.createContext({
  sub: placeholder,
  checkUserConfirmed: checkUserPlaceholder,
  getRealmApp: getRealmPlaceholder,
  setUserConfirmed,
  client,
})

