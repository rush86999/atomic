package org.acme.kotlin.atomic.meeting.assist.domain

import org.optaplanner.core.api.domain.entity.PlanningEntity
import org.optaplanner.core.api.domain.lookup.PlanningId
import org.optaplanner.core.api.domain.variable.PlanningVariable
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.*
import javax.persistence.*

@PlanningEntity
@Entity
@Table(name="event_part_optaplanner", indexes = [
    Index(name = "sk_userId_eventPart_optaplanner", columnList = "userId"),
    Index(name = "sk_groupId_eventPart_optaplanner", columnList = "groupId"),
    Index(name = "sk_eventId_eventPart_optaplanner", columnList = "eventId"),
    Index(name = "sk_hostId_eventPart_optaplanner", columnList = "hostId"),
])
class EventPart {
    @PlanningId
    @Id
    @GeneratedValue
    var id: Long? = null

    lateinit var groupId: String
    lateinit var eventId: String
    var part: Int = 1
    var lastPart: Int = 1
    var meetingPart: Int = -1
    var meetingLastPart: Int = -1
    lateinit var startDate: String
    lateinit var endDate: String

    var taskId: String? = null
    var softDeadline: String? = null
    var hardDeadline: String? = null
    lateinit var userId: UUID
    lateinit var hostId: UUID
    var meetingId: String? = null
    @ManyToOne
    @JoinColumn(name = "userId", referencedColumnName = "id", insertable = false, updatable = false)
    lateinit var user: User

    var priority: Int = 1
    var isPreEvent: Boolean = false
    var isPostEvent: Boolean = false
    var forEventId: String? = null
    var positiveImpactScore: Int = 0
    var negativeImpactScore: Int = 0
    var positiveImpactDayOfWeek: DayOfWeek? = null
    var positiveImpactTime: LocalTime? = null
    var negativeImpactDayOfWeek: DayOfWeek? = null
    var negativeImpactTime: LocalTime? = null
    var modifiable: Boolean = true
    var preferredDayOfWeek: DayOfWeek? = null
    var preferredTime: LocalTime? = null
    var isExternalMeeting: Boolean = false
    var isExternalMeetingModifiable: Boolean = true
    var isMeetingModifiable: Boolean = true
    var isMeeting: Boolean = false
    var dailyTaskList: Boolean = false
    var weeklyTaskList: Boolean = false
    var gap: Boolean = false
    var preferredStartTimeRange: LocalTime? = null
    var preferredEndTimeRange: LocalTime? = null
    var totalWorkingHours: Int = 8

    @ManyToOne
    @JoinColumn(name = "eventId", referencedColumnName = "id", insertable = false, updatable = false)
    lateinit var event: Event

    @PlanningVariable(valueRangeProviderRefs = ["timeslotRange"])
    @ManyToOne
    var timeslot: Timeslot? = null

    // No-arg constructor required for Hibernate and Opta Planner
    constructor()

    constructor(groupId: String, part: Int, lastPart: Int, startDate: String, endDate: String, taskId: String?, softDeadline: String?, hardDeadline: String?, userId: UUID, user: User, priority: Int, isPreEvent: Boolean, isPostEvent: Boolean, forEventId: String?, positiveImpactScore: Int, negativeImpactScore: Int, positiveImpactDayOfWeek: DayOfWeek?, positiveImpactTime: LocalTime?, negativeImpactDayOfWeek: DayOfWeek?, negativeImpactTime: LocalTime?, modifiable: Boolean, preferredDayOfWeek: DayOfWeek?, preferredTime: LocalTime?, isMeeting: Boolean, isExternalMeeting: Boolean, isExternalMeetingModifiable: Boolean, isMeetingModifiable: Boolean, dailyTaskList: Boolean, weeklyTaskList: Boolean,
                gap: Boolean, preferredStartTimeRange: LocalTime?, preferredEndTimeRange: LocalTime?, totalWorkingHours: Int,
                eventId: String, event: Event, hostId: UUID,
                meetingId: String?, meetingPart: Int, meetingLastPart: Int
    ) {
        this.groupId = groupId
        this.part = part
        this.lastPart = lastPart
        this.endDate = endDate.trim()
        this.startDate = startDate.trim()
        this.taskId = taskId?.trim()
        this.softDeadline = softDeadline?.trim()
        this.hardDeadline = hardDeadline?.trim()
        this.userId = userId
        this.user = user
        this.priority = priority
        this.isPreEvent = isPreEvent
        this.isPostEvent = isPostEvent
        this.forEventId = forEventId
        this.positiveImpactScore = positiveImpactScore
        this.negativeImpactScore = negativeImpactScore
        this.positiveImpactDayOfWeek = positiveImpactDayOfWeek
        this.positiveImpactTime = positiveImpactTime
        this.negativeImpactDayOfWeek = negativeImpactDayOfWeek
        this.negativeImpactTime = negativeImpactTime
        this.modifiable = modifiable
        this.preferredDayOfWeek = preferredDayOfWeek
        this.preferredTime = preferredTime
        this.isMeeting = isMeeting
        this.isExternalMeeting = isExternalMeeting
        this.isExternalMeetingModifiable = isExternalMeetingModifiable
        this.isMeetingModifiable = isMeetingModifiable
        this.dailyTaskList = dailyTaskList
        this.weeklyTaskList = weeklyTaskList
        this.gap = gap
        this.preferredStartTimeRange = preferredStartTimeRange
        this.preferredEndTimeRange = preferredEndTimeRange
        this.totalWorkingHours = totalWorkingHours
        this.eventId = eventId
        this.event = event
        this.hostId = hostId
        this.meetingId = meetingId
        this.meetingPart = meetingPart
        this.meetingLastPart = meetingLastPart
    }

    constructor(id: Long?, groupId: String, part: Int, lastPart: Int, startDate: String,
                endDate: String, taskId: String?, softDeadline: String?,
                hardDeadline: String?, userId: UUID, user: User,
                priority: Int, isPreEvent: Boolean, isPostEvent: Boolean,
                forEventId: String?, positiveImpactScore: Int,
                negativeImpactScore: Int, positiveImpactDayOfWeek: DayOfWeek?,
                positiveImpactTime: LocalTime?, negativeImpactDayOfWeek: DayOfWeek?,
                negativeImpactTime: LocalTime?, modifiable: Boolean,
                preferredDayOfWeek: DayOfWeek?, preferredTime: LocalTime?,
                isMeeting: Boolean, isExternalMeeting: Boolean,
                isExternalMeetingModifiable: Boolean, isMeetingModifiable: Boolean,
                dailyTaskList: Boolean, weeklyTaskList: Boolean, timeslot: Timeslot?, gap: Boolean,
                preferredStartTimeRange: LocalTime?, preferredEndTimeRange: LocalTime?, totalWorkingHours: Int,
                eventId: String, event: Event, hostId: UUID,
                meetingId: String?, meetingPart: Int, meetingLastPart: Int,
    )
            : this(groupId, part, lastPart, startDate, endDate, taskId, softDeadline, hardDeadline, userId, user,
        priority, isPreEvent, isPostEvent, forEventId,
        positiveImpactScore, negativeImpactScore, positiveImpactDayOfWeek,
        positiveImpactTime, negativeImpactDayOfWeek, negativeImpactTime,
        modifiable, preferredDayOfWeek, preferredTime, isMeeting,
        isExternalMeeting, isExternalMeetingModifiable, isMeetingModifiable,
        dailyTaskList, weeklyTaskList, gap, preferredStartTimeRange, preferredEndTimeRange, totalWorkingHours,
        eventId, event, hostId, meetingId, meetingPart, meetingLastPart,
    ) {
        this.id = id
        this.timeslot = timeslot
    }

}