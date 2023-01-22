import got from 'got'
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'

import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { AppleRevokeTokenUrl, AppleClientId, AppleClientSecret, region, userPoolId, hasuraAdminSecret, hasuraGraphUrl } from './constants';

dayjs.extend(utc)
dayjs.extend(timezone)

const client = new CognitoIdentityProviderClient({ region })

export const appleRevokeToken = async (refreshToken: string, accessToken: string) => {
    try {
        const res = await got.post(AppleRevokeTokenUrl, {
            form: {
                client_id: AppleClientId,
                token: refreshToken,
                client_secret: AppleClientSecret,
                token_type_hint: 'refresh_token'
            },
        }).json()




        const res2 = await got.post(AppleRevokeTokenUrl, {
            form: {
                client_id: AppleClientId,
                token: accessToken,
                client_secret: AppleClientSecret,
                token_type_hint: 'access_token'
            },
        }).json()



    } catch (e) {

    }
}

export const deleteCognitoUser = async (userName: string) => {
    try {
        const command = new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: userName
        })
        const res = await client.send(command)


    } catch (e) {

    }
}

export const deleteUserFromDb = async (userId: string) => {
    try {
        const operationName = 'DeleteUser'
        const query = `
            mutation DeleteUser($id: uuid!) {
                delete_User_by_pk(id: $id) {
                    createdDate
                    deleted
                    email
                    id
                    name
                    updatedAt
                    userPreferenceId
                }
            }
        `
        const variables = {
            id: userId
        }
        const res = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables
            }
        }).json()


    } catch (e) {

    }
}

