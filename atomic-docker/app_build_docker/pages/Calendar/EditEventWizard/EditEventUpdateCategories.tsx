import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
  import {
   FlatList,
   Pressable,
} from 'react-native'
 import { IoIosAdd, IoIosClose } from "react-icons/io";
import Select from 'react-select'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { addItemToCategories, removeItemFromCategories } from '@lib/Calendar/CreateEventWizard/wizardHelper'
import { palette } from '@lib/theme/theme'

import {
  CategoryType
} from '@lib/dataTypes/CategoryType'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
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
    setParentSelectedCategories: Dispatch<SetStateAction<CategoryType[]>>,
    selectedCategories: CategoryType[],
    categories: CategoryType[],
}

export type OptionType = {
    label: string,
    value: string,
}

function EditEventUpdateCategories(props: Props) {
    const [selectedTag, setSelectedTag] = useState<OptionType>()
    const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>()

    const setParentSelectedCategories = props?.setParentSelectedCategories
    const tags = props?.categories ?? []
    const [selectedTagObjects, setSelectedTagObjects] = useState<CategoryType[]>(props?.selectedCategories ?? [])


    const changeSelectedTag = (item: OptionType) => {
        console.log(item, ' value inside changeselectedtag')
        setSelectedTag(item)
        setSelectedTagObject(tags?.find(tag => tag?.id === item?.value))
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <Text variant="optionHeader">
                    Add tags to this event
                </Text>
            </Box>
            <Box flex={2} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    defaultValue={{ value: tags?.[0]?.id ?? 'null', label: tags?.[0]?.name ?? 'null' }}
                    isSearchable
                    isClearable
                    options={tags?.map(t => ({ label: t?.name, value: t?.id }))}
                    value={selectedTag}
                    onChange={changeSelectedTag}
                />    
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <FlatList
                    data={selectedTagObjects}
                    renderItem={({ item, index }) => (
                        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '60%'}}>
                                <Text variant="optionHeader">
                                    {item.name}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeItemFromCategories(selectedTagObjects, setSelectedTagObjects, setParentSelectedCategories, index)}>
                                    <IoIosClose size="3em" color={palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item?.id}
                />
            </Box>
            <Box flex={0.5}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <Pressable onPress={() => addItemToCategories(setSelectedTag, selectedTagObject, setSelectedTagObject, selectedTagObjects, setSelectedTagObjects, setParentSelectedCategories)}>
                    <Box flex={1} flexDirection="row" justifyContent="center" alignItems="center" style={{ width: '10%'}}>
                        <span className="mr-2">
                            <IoIosAdd size="3em" color={palette.pinkPrimary} />
                        </span>
                        <span>
                            <Text variant="buttonLink">
                                Add
                            </Text>
                        </span>
                    </Box>
                </Pressable>
            </Box>
        </Box>
    )
}

export default EditEventUpdateCategories
