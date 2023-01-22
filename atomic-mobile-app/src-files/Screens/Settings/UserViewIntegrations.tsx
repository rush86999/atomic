import React, { useState, useEffect } from 'react'
import {
  FlatList,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
  Appearance,
 } from 'react-native'

import { DataStore } from '@aws-amplify/datastore'
import Toast from 'react-native-toast-message'
import { FAB } from 'react-native-elements/src'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  Integration,
} from '@models'

import UserIntegrationItem from './UserIntegrationItem'



const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  }
})

type Props = {
  sub: string,
}


type IntegrationType = {
  id?: string,
  token: string,
  resource: string,
  resourceId: string,
  name: string,
  tableName: string,
}


function UserViewIntegrations(props: Props) {
  const [isValid, setIsValid] = useState<boolean>(true)
  const [ids, setIds] = useState<string[]>([])
  const [tokens, setTokens] = useState<string[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [resourceIds, setResourceIds] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [tableNames, setTableNames] = useState<string[]>(['Daily'])
  const [integrations, setIntegrations] = useState<Integration[]>([])


  const { sub } = props

  const dark = useColorScheme() === 'dark'

  useEffect(() => {
    (async () => {
      try {
        const oldIntegrations = await DataStore.query(Integration, c => c.sub('eq', sub))
        
        if (oldIntegrations?.[0]?.id) {

          const oldIds = oldIntegrations.map(i => (i.id))
          const oldTokens = oldIntegrations.map(i => (i?.token || ''))
          const oldResources = oldIntegrations.map(i => (i?.resource || ''))
          const oldResourceIds = oldIntegrations.map(i => (i?.resourceId || ''))
          const oldNames = oldIntegrations.map(i => (i?.name || ''))
          const oldTableNames = oldIntegrations.map(i => (i?.tableName || ''))

          setIds(oldIds)
          setTokens(oldTokens)
          setResources(oldResources)
          setResourceIds(oldResourceIds)
          setNames(oldNames)
          setTableNames(oldTableNames)
          setIntegrations(oldIntegrations)
        }
      } catch(e) {
        
      }
    })()
  }, [])

  const addEmptyIntegration = () => {

    const newIds = [...ids, 'null']
    const newTokens = [...tokens, '']
    const newResources = [...resources, '']
    const newResourceIds = [...resourceIds, '']
    const newNames = [...names, '']
    const newTableNames = [...tableNames, '']
    const newIntegrations: Integration[] = [...integrations, {
      id: 'null',
      token: '',
      resource: '',
      resourceId: '',
      name: '',
      tableName: '',
      sub,
    }]

    setIds(newIds)
    setTokens(newTokens)
    setResources(newResources)
    setResourceIds(newResourceIds)
    setNames(newNames)
    setTableNames(newTableNames)
    setIntegrations(newIntegrations)
  }

  const createIntegration = async ({
    token,
    resource,
    resourceId,
    name,
    tableName,
  }: IntegrationType) => {
    try {
      if (!isValid) {
        Toast.show({
          type: 'error',
          text1: 'Empty Value',
          text2:  'You have an empty value that needs to be filled before it can be created',
        })
        return
      }
      const newIntegration = new Integration({
        token,
        resource,
        resourceId,
        name,
        tableName,
        sub,
      })

      const savedIntegration = await DataStore.save(newIntegration)

      

      Toast.show({
        type: 'success',
        text1: 'Save successful',
        text2: `New integration: ${name} successfully saved`
      })

      return savedIntegration.id
    } catch(e) {
      
    }
  }

  const updateIntegration = async ({
    id,
    name,
  }: IntegrationType) => {
    try {
      if (!isValid) {
        Toast.show({
          type: 'error',
          text1: 'Empty Value',
          text2:  'You have an empty value that needs to be filled before it can be created',
        })
        return
      }

      let changed = false



      
      if (changed) {
        Toast.show({
          type: 'success',
          text1: 'Save successful',
          text2: `Integration: ${name} successfully updated`
        })
      }
    } catch(e) {
      
    }
  }

  const removeIdValue = (index: number) => {
    const newIds = ids
      .slice(0, index)
      .concat(ids.slice(index + 1))

    setIds(newIds)
  }

  const updateTokenValue = (index: number, value: string) => {
    const newTokens = tokens
      .slice(0, index)
      .concat([value])
      .concat(tokens.slice(index + 1))

    setTokens(newTokens)

    const newIntegrations = integrations
      .slice(0, index)
      .concat([{ ...(integrations[index]), token: value }])
      .concat(integrations.slice(index + 1))

    setIntegrations(newIntegrations)

  }

  const removeTokenValue = (index: number) => {
    const newTokens = tokens
      .slice(0, index)
      .concat(tokens.slice(index + 1))

    setTokens(newTokens)
  }

  const updateResourceValue = (index: number, value: string) => {
    const newResources = resources
      .slice(0, index)
      .concat([value])
      .concat(resources.slice(index + 1))

    setResources(newResources)

    const newIntegrations = integrations
      .slice(0, index)
      .concat([{ ...(integrations[index]), resource: value}])
      .concat(integrations.slice(index + 1))

    setIntegrations(newIntegrations)
  }

  const removeResourceValue = (index: number) => {
    const newResources = resources
      .slice(0, index)
      .concat(resources.slice(index + 1))

    setResources(newResources)
  }

  const updateResourceIdValue = (index: number, value: string) => {
    const newResourceIds = resourceIds
      .slice(0, index)
      .concat([value])
      .concat(resourceIds.slice(index + 1))

    setResourceIds(newResourceIds)

    const newIntegrations = integrations
      .slice(0, index)
      .concat([{ ...(integrations[index]), resourceId: value }])
      .concat(integrations.slice(index + 1))

    setIntegrations(newIntegrations)
  }

  const removeResourceIdValue = (index: number) => {
    const newResourceIds = resourceIds
      .slice(0, index)
      .concat(resourceIds.slice(index + 1))

    setResourceIds(newResourceIds)
  }

  const updateNameValue = (index: number, value: string) => {
    const newNames = names
      .slice(0, index)
      .concat([value])
      .concat(names.slice(index + 1))

    setNames(newNames)

    const newIntegrations = integrations
      .slice(0, index)
      .concat([{ ...(integrations[index]), name: value}])
      .concat(integrations.slice(index + 1))

    setIntegrations(newIntegrations)

  }

  const removeNameValue = (index: number) => {
    const newNames = names
      .slice(0, index)
      .concat(names.slice(index + 1))

    setNames(newNames)
  }

  const updateTableNameValue = (index: number, value: string) => {
    const newTableNames = tableNames
      .slice(0, index)
      .concat([value])
      .concat(tableNames.slice(index + 1))

    setTableNames(newTableNames)

    const newIntegrations = integrations
      .slice(0, index)
      .concat([{ ...(integrations[index]), tableName: value}])
      .concat(integrations.slice(index + 1))

    setIntegrations(newIntegrations)

  }

  const removeTableNameValue = (index: number) => {

    const newTableNames = tableNames
      .slice(0, index)
      .concat(tableNames.slice(index + 1))

    setTableNames(newTableNames)
  }

  const removeIntegration = async (index: number) => {
    try {
      removeIdValue(index)
      removeTokenValue(index)
      removeResourceValue(index)
      removeResourceIdValue(index)
      removeNameValue(index)
      removeTableNameValue(index)

      const newIntegrations: Integration[] = integrations
        .slice(0, index)
        .concat(integrations.slice(index + 1))

      setIntegrations(newIntegrations)

      const toDelete = await DataStore.query(Integration, ids[index])

      if (toDelete?.id) {
        const deleted = await DataStore.delete(toDelete)

      }

    } catch(e) {
      
    }
  }

  const submitIntegrations = async () => {
    try {
      let isValid = true
      names.forEach(i => {
        if (!(i?.length > 0)) {
          isValid = false
        }
      })

      

      if (!isValid) {
        
        return
      }

      
    } catch(e) {
      
    }
  }




  const renderItem = ({ item, index }: { item: Integration, index: number }): JSX.Element => (
      <UserIntegrationItem
        index={index}
        token={item?.token}
        resource={item?.resource}
        resourceId={item?.resourceId}
        name={item?.name}
        tableName={item?.tableName}
        updateParentTokenValue={updateTokenValue}
        updateParentResourceValue={updateResourceValue}
        updateParentResourceIdValue={updateResourceIdValue}
        updateParentNameValue={updateNameValue}
        updateParentTableNameValue={updateTableNameValue}
        removeParentIntegration={removeIntegration}
      />
  )

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box flex={8} justifyContent="center" alignItems="center" m={{ phone: 'm', tablet: 'l' }} style={{ width: '100%' }}>
        <TouchableWithoutFeedback style={{ width: '100%' }} onPress={Keyboard.dismiss}>
          {
            integrations?.length > 0
            ? (
              <FlatList
                data={integrations}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                removeClippedSubviews={false}
              />
            ) : (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="header" style={{ color: dark ? palette.white : palette.darkGray }}>
                  No Integrations, Try adding a new integration
                </Text>
              </Box>
            )
          }
        </TouchableWithoutFeedback>
      </Box>
      <Box flex={2} m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
        {
            ids?.length > 0
            ? (
              <Button onPress={submitIntegrations}>
                Save
              </Button>
            ) : null
        }
      </Box>
      <Box style={styles.container} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <FAB
            icon={{
              name: 'add',
              type: 'ionicon',
              color: '#fff',
             }}
            onPress={addEmptyIntegration}
            style={styles.fab}
          />
        </SafeAreaView>
      </Box>
    </Box>
  )

}

export default UserViewIntegrations
