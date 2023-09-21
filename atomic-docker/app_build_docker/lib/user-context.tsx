import { v4 as uuid } from 'uuid'
import { createContext, useContext } from 'react';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

const placeholder = uuid()

const client: ApolloClient<NormalizedCacheObject> | null = null
// let globalSub = 'null'
// let globalUserId1 = 'null'

export const AppContext = createContext({
    sub: placeholder,
    client,

});



export function useAppContext() {
    return useContext(AppContext);
}