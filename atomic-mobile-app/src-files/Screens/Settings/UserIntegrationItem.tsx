import React, { useState } from 'react'
import {
  useColorScheme,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
 } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { TextField } from 'react-native-ui-lib'

import {Picker} from '@react-native-picker/picker'


import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'

import { palette } from '@theme/theme'


// dayjs.extend(utc)

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
      
    }
  }

  const height = useHeaderHeight()

  return (
    <TouchableWithoutFeedback style={{ width: '100%' }} onPress={Keyboard.dismiss}>
      <RegularCard justifyContent="center" alignItems="center" style={{ width: '97%' }}>
        <Text variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
          {name}
        </Text>
        <KeyboardAvoidingView
          keyboardVerticalOffset={height + 64}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TextField
            onChangeText={updateNameValue}
            value={name}
            placeholder="Notion"
            title="Name"
            style={{ width: '80%' }}
            helperText="Type name of connected app here - required"
          />
          <TextField
            onChangeText={updateTokenValue}
            value={token}
            placeholder="abc123"
            title="Token"
            style={{ width: '80%' }}
            helperText="Copy and Paste token here - optional"
          />
          <TextField
            onChangeText={updateResourceValue}
            value={resource}
            placeholder="database"
            title="Resource"
            style={{ width: '80%' }}
            helperText="Name of resource that is part of the connected app - optional"
          />
          <TextField
            onChangeText={updateResourceIdValue}
            value={resourceId}
            placeholder="abc123"
            title="Resource Id"
            style={{ width: '80%' }}
            helperText="Resource Id that is part of the connected app - optional"
          />
        </KeyboardAvoidingView>
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
        <Button onPress={() => removeIntegration()}>
          Remove
        </Button>
      </RegularCard>
    </TouchableWithoutFeedback>
  )

}
export default UserIntegrationItem
