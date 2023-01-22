import { SESClient, SendBulkTemplatedEmailCommand, SendEmailCommand, SendEmailCommandInput, SendBulkTemplatedEmailCommandInput, BulkEmailDestination } from "@aws-sdk/client-ses"
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { BulkMeetingCancelledDetailsToAttendeeType, BulkMeetingInviteDetailsToAttendeeType, MeetingInviteDetailsToHostType } from "@libs/types"
import { ConfigurationSetName, EMAIL } from "./constants"
// import {phone} from 'phone'
// import {
//     SNSClient, CheckIfPhoneNumberIsOptedOutCommand,
//     CheckIfPhoneNumberIsOptedOutCommandInput,
//     SetSMSAttributesCommand,
//     SetSMSAttributesCommandInput,
// } from '@aws-sdk/client-sns'

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

const sesClient = new SESClient({ region: "us-east-1" })
// const snsClient = new SNSClient({ region: "us-east-1" })

export const sendMeetingInviteDetailsToHost = async (meetingInvite: MeetingInviteDetailsToHostType) => {
    try {
        const attendees = meetingInvite?.attendees
        const hostName = meetingInvite?.hostName
        const hostEmail = meetingInvite?.hostEmail
        const title = meetingInvite?.title
        const notes = meetingInvite?.notes
        const windowStartDate = meetingInvite?.windowStartDate
        const windowEndDate = meetingInvite?.windowEndDate
        const timezone = meetingInvite?.timezone

        let attendeeHtmlString = ''
        let attendeeTextString = ''

        for (const attendee of attendees) {
            attendeeHtmlString += '<p>'
            attendeeHtmlString += '<a href='
            attendeeHtmlString += '"mailto:'
            attendeeHtmlString += attendee?.email
            attendeeHtmlString += '"'
            attendeeHtmlString += '>'
            attendeeHtmlString += (attendee?.name || attendee?.email)
            attendeeHtmlString += '</a>'
            attendeeHtmlString += ' - '
            attendeeHtmlString += '<a href='
            attendeeHtmlString += '"'
            attendeeHtmlString += attendee?.link
            attendeeHtmlString += '"'
            attendeeHtmlString += '>'
            attendeeHtmlString += 'link'
            attendeeHtmlString += '</a>'
            attendeeHtmlString += '</p>'

            attendeeTextString += attendee?.name
            attendeeTextString += (' ' + '(' + attendee?.email + ')' + ' ')
            attendeeTextString += ' - '
            attendeeTextString += attendee?.link
            attendeeTextString += '\r\n'
        }

        const htmlBody = `
                <h1>Hello ${hostName},</h1>
                <p>Meeting Assist information:</p>
                <p>${title}</p>
                <p>${notes}</p>
                <p>Time window start: ${dayjs(windowStartDate).tz(timezone).format('dddd, MMMM D, YYYY h:mm A')}</p>
                <p>Time window end: ${dayjs(windowEndDate).tz(timezone).format('dddd, MMMM D, YYYY h:mm A')}</p>
                <p>Here are the links generated for each attendee: </p>
                    ${attendeeHtmlString}
                <p> Atomic team </p>
            </body>
            </html>
        `;

        const textBody = `
           Hello ${hostName},\r\n
           Meeting Assist information:\r\n
            ${title}\r\n
            ${notes}\r\n
            Time window start: ${dayjs(windowStartDate).tz(timezone).format('dddd, MMMM D, YYYY h:mm A')}\r\n
            Time window end: ${dayjs(windowEndDate).tz(timezone).format('dddd, MMMM D, YYYY h:mm A')}\r\n
            Here are the links generated for each attendee: \r\n
                ${attendeeTextString}
             Atomic team \r\n
        `

        const sendEmailInput: SendEmailCommandInput = {
            Destination: {
                ToAddresses: [hostEmail],
            },
            Source: `Atomic team <${EMAIL}>`,
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: htmlBody,
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: textBody,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Your meeting invite info',
                },

            }
        }

        const command = new SendEmailCommand(sendEmailInput);
        const response = await sesClient.send(command)


    } catch (e) {

    }
}

export const sendBulkCancelToMeetingEmail = async (meetingCancel: BulkMeetingCancelledDetailsToAttendeeType) => {
    try {
        const attendees = meetingCancel?.attendees
        const hostName = meetingCancel?.hostName
        const hostEmail = meetingCancel?.hostEmail

        // validate
        if (!(attendees?.length > 0)) {
            throw new Error('no attendees provided')
        }

        if (!hostName) {
            throw new Error('no hostName provided')
        }

        if (!hostEmail) {
            throw new Error('no hostEmail provided')
        }

        const destinations: BulkEmailDestination[] = []

        for (const attendee of attendees) {
            const destination: BulkEmailDestination = {
                Destination: {
                    ToAddresses: [
                        attendee?.email,
                    ]
                },
                ReplacementTemplateData: JSON.stringify({
                    name: attendee?.name,
                    hostEmail,
                    hostName,
                })
            }
            destinations.push(destination)
        }

        const sendBulkEmailInput: SendBulkTemplatedEmailCommandInput = {
            Source: "Atomic team <no-reply@atomiclife.app",
            Template: "AtomicCancelToMeetingTemplate",
            Destinations: destinations,
            ConfigurationSetName: ConfigurationSetName,
            ReplyToAddresses: [hostEmail]
        }

        const command = new SendBulkTemplatedEmailCommand(sendBulkEmailInput);
        const response = await sesClient.send(command)

    } catch (e) {

    }
}

export const sendBulkInviteToMeetingEmail = async (
    meetingInvite: BulkMeetingInviteDetailsToAttendeeType,
) => {
    try {
        const attendees = meetingInvite?.attendees
        const hostName = meetingInvite?.hostName
        const hostEmail = meetingInvite?.hostEmail

        // validate
        if (!(attendees?.length > 0)) {
            throw new Error('no attendees provided')
        }

        if (!hostName) {
            throw new Error('no hostName provided')
        }

        if (!hostEmail) {
            throw new Error('no hostEmail provided')
        }

        const destinations: BulkEmailDestination[] = []

        for (const attendee of attendees) {
            const destination: BulkEmailDestination = {
                Destination: {
                    ToAddresses: [
                        attendee?.email,
                    ]
                },
                ReplacementTemplateData: JSON.stringify({
                    name: attendee?.name,
                    hostEmail,
                    hostName,
                    link: attendee?.link,
                })
            }

            destinations.push(destination)
        }

        const sendBulkEmailInput: SendBulkTemplatedEmailCommandInput = {
            Source: "Atomic team <no-reply@atomiclife.app>",
            Template: "AtomicInviteToMeetingTemplate",
            Destinations: destinations,
            ConfigurationSetName: ConfigurationSetName,
            ReplyToAddresses: [hostEmail],
            DefaultTemplateData: JSON.stringify({})
        }

        const command = new SendBulkTemplatedEmailCommand(sendBulkEmailInput);
        const response = await sesClient.send(command)


    } catch (e) {

    }
}

// export const sendSMSMessage = async (
//     phoneNumber: string,
//     name: string,
//     link: string,
// ) => {
//     try {
//         const e164FormatPhone = phone(phoneNumber)?.phoneNumber

//         // check if number has opted out
//         const optedOutVariable: CheckIfPhoneNumberIsOptedOutCommandInput = {
//             phoneNumber: e164FormatPhone,
//         }

//         const optedOutCommand = new CheckIfPhoneNumberIsOptedOutCommand(optedOutVariable)
//         const optedOutRes = await snsClient.send(optedOutCommand)

//         if (optedOutRes) {
//             
//             return
//         }

//         // set default to transactional
//         const smsAttributeInput: SetSMSAttributesCommandInput = {
//             attributes: {
//                 /* required */
//                 DefaultSMSType: "Transactional" /* highest reliability */,
//                 //'DefaultSMSType': 'Promotional' /* lowest cost */
//             },
//         }

//     } catch (e) {
//         
//     }
//  }