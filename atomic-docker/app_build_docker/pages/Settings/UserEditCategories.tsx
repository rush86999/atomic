import React, {
    useState,
    useEffect,
} from 'react'
import {
    FlatList,
    Pressable,
} from 'react-native'
import { IoIosClose } from "react-icons/io"
import { MdPlaylistAdd } from "react-icons/md";
import { useToast } from '@chakra-ui/react'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { CategoryType } from '@lib/dataTypes/CategoryType'
import {
    addCategoryToUser,
    listUserCategories,
    removeCategory,
    removeEventConnectionsForCategory,
} from '@lib/Category/CategoryHelper'

import { palette } from '@lib/theme/theme'
import TextField from '@components/TextField'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
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

function UserEditCategories() {
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [name, setName] = useState<string>('')

    const router = useRouter()
    const { sub, client } = useAppContext()
    const userId = sub
    const isUpdate = router.query?.isUpdate as string
    const toast = useToast()

    // get categories
    useEffect(() => {
        (async () => {
            try {
                const existingCategories = await listUserCategories(client, userId)
                if (existingCategories.length === 0) {
                    toast({
                        status: 'warning',
                        title: 'No tags found',
                        description: 'Please add a tag',
                        duration: 9000,
                        isClosable: true,
                    })
                }

                setCategories(existingCategories)
                
            } catch (e) {
                console.log(e, 'error in useEffect for UserEditCategories')
            }
        })()
    }, [client, isUpdate, userId, toast])

    // add new category to categories
    const addCategory = async () => {
        try {
            // validate
            if (name.length === 0) {
                return
            }
            const newCategory = await addCategoryToUser(client, userId, name)
            setCategories([...categories, newCategory])
            setName('')
        } catch (error) {
            console.log(error)
        }
    }

    // remove category from categories
    const removeCategoryForUser = async (categoryId: string) => {
        try {
            setCategories(categories.filter(category => category.id !== categoryId))
            await removeCategory(client, categoryId)
            await removeEventConnectionsForCategory(client, categoryId)
        } catch (error) {
            console.log(error)
        }
    }

    const onPress = (categoryId: string, name: string) => {
        console.log(categoryId, name, ' categoryId, name, inside onPress')
        if (!categoryId) {
            return
        }
        if (!name) {
            return
        }

        router.push({ pathname: '/Settings/UserEditCategory', query: {
            categoryId,
            name,
        }})
    }



    return (
        <Box justifyContent="center" alignItems="center" width="100%">
            <Box justifyContent="center" alignItems="center" minHeight="60vh" width="80%">
                <FlatList
                    data={categories}
                    renderItem={({ item, index }) => (
                        <Box pt={{ phone: 's', tablet: 'm'}} justifyContent="center" alignItems="center" width="100%">
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
                                <Box justifyContent="center" alignItems="flex-start" mr={{ phone:'s', tablet: 'm' }}>
                                    <Text variant="optionHeader">
                                        {item.name}
                                    </Text>
                                </Box>
                                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                                    <Pressable hitSlop={15} onPress={() => onPress(item?.id, item?.name)}>
                                        <MdPlaylistAdd size="3em" color={palette.purplePrimary} />
                                    </Pressable>
                                    <Pressable hitSlop={15} onPress={() => removeCategoryForUser(categories?.[index]?.id)}>
                                        <IoIosClose size="3em" color={palette.red} />
                                    </Pressable>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
            </Box>
            <Box >
                <Box pt={{ phone: 'xs', tablet: 's' }}>

                        <TextField
                            onChange={(e: { target: { value: string } }) => setName(e?.target?.value)}
                            value={name}
                            placeholder="Get together"
                            label="Tag"
                            
                        />
               
                </Box>
            </Box>
            <Box  pt={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                <Button onClick={addCategory}>
                    Add New Tag
                </Button>
            </Box>
        </Box>
    )

}

export default UserEditCategories


