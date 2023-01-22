
export type HH = '00' | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23'
export type MM = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12'

export type Time = `${HH}:${MM}`

export type MeetingAssistPreferredTimeRangeType = {
    id: string,
    meetingId: string,
    dayOfWeek?: number,
    startTime: Time,
    endTime: Time,
    updatedAt: string,
    createdDate: string,
    hostId: string,
    attendeeId: string,
}
