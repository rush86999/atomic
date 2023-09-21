import React, { useState } from 'react'
import {
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
 } from 'react-native'

import TextField from '@components/TextField'
import {Picker} from '@react-native-picker/picker'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'

import { palette } from '@lib/theme/theme'
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

type Props = {
  index: number,
  token?: string,
  resource?: string,
  resourceId?: string,
  name?: string,
  tableName?: string,
  updateParentTokenValue: (index: number, value: string) => void,
  updateParentResourceValue: (index: number, value: string) => void,
  updateParentResourceIdValue: (index: number, value: string) => void,
  updateParentNameValue: (index: number, value: string) => void,
  updateParentTableNameValue: (index: number, value: string) => void,
  removeParentIntegration: (index: number) => Promise<void>,
}

function UserIntegrationItem(props: Props) {

  const {
    index,
    token: oldToken,
    resource: oldResource,
    resourceId: oldResourceId,
    name: oldName,
    tableName: oldTableName,
    updateParentTokenValue,
    updateParentResourceValue,
    updateParentResourceIdValue,
    updateParentNameValue,
    updateParentTableNameValue,
    removeParentIntegration,
  } = props

  const [token, setToken] = useState<string>(oldToken || '')
  const [resource, setResource] = useState<string>(oldResource || '')
  const [resourceId, setResourceId] = useState<string>(oldResourceId || '')
  const [name, setName] = useState<string>(oldName || '')
  const [tableName, setTableName] = useState<string>(oldTableName)


  const dark = useColorScheme() === 'dark'

  const updateTokenValue = (value: string) => {
    setToken(value)
    updateParentTokenValue(index, value)
  }

  const updateResourceValue = (value: string) => {
    setResource(value)
    updateParentResourceValue(index, value)
  }

  const updateResourceIdValue = (value: string) => {
    setResourceId(value)
    updateParentResourceIdValue(index, value)
  }

  const updateNameValue = (value: string) => {
    setName(value)
    updateParentNameValue(index, value)
  }

  const updateTableNameValue = (value: string) => {
    setTableName(value)
    updateParentTableNameValue(index, value)
  }

  const removeIntegration = async () => {
    try {
      await removeParentIntegration(index)
    } catch(e) {
      console.log(e, ' unable to remove integration')
    }
  }

  return (
    <TouchableWithoutFeedback style={{ width: '100%' }} onPress={Keyboard.dismiss}>
      <RegularCard justifyContent="center" alignItems="center" style={{ width: '97%' }}>
        <Text variant="optionHeader" p={{ phone: 's', tablet: 'm' }}>
          {name}
        </Text>
          <TextField
            onChange={(e: { target: { value: string } }) => updateNameValue(e?.target?.value)}
            value={name}
            placeholder="Notion"
            label="Name"
            style={{ width: '80%' }}
            hint="Type name of connected app here - required"
          />
          <TextField
            onChange={(e: { target: { value: string } }) => updateTokenValue(e?.target?.value)}
            value={token}
            placeholder="abc123"
            label="Token"
            style={{ width: '80%' }}
            hint="Copy and Paste token here - optional"
          />
          <TextField
            onChange={(e: { target: { value: string } }) => updateResourceValue(e?.target?.value)}
            value={resource}
            placeholder="database"
            label="Resource"
            style={{ width: '80%' }}
            hint="Name of resource that is part of the connected app - optional"
          />
          <TextField
            onChange={(e: { target: { value: string } }) => updateResourceIdValue(e?.target?.value)}
            value={resourceId}
            placeholder="abc123"
            label="Resource Id"
            style={{ width: '80%' }}
            hint="Resource Id that is part of the connected app - optional"
          />
        <Picker
          selectedValue={tableName}
          onValueChange={updateTableNameValue}
          style={{ width: '80%', color: dark ? palette.white : palette.textBlack}}
        >
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="Daily" value="Daily" label="Daily" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="Weekly" value="Weekly" label="Weekly" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="Master" value="Master" label="Master" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="Grocery" value="Grocery" label="Grocery" />
        </Picker>
        <Button onClick={() => removeIntegration()}>
          Remove
        </Button>
      </RegularCard>
    </TouchableWithoutFeedback>
  )

}
export default UserIntegrationItem
