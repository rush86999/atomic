package org.acme.kotlin.atomic.meeting.assist.domain

import org.optaplanner.core.api.domain.lookup.PlanningId
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.*
import javax.persistence.*

@Entity
@Table(name="preferredTimeRange_optaplanner", indexes = [
    Index(name = "sk_eventId_preferredTimeRange_optaplanner", columnList = "eventId"),
    Index(name = "sk_userId_preferredTimeRange_optaplanner", columnList = "userId"),
    Index(name = "sk_hostId_preferredTimeRange_optaplanner", columnList = "hostId"),
])
class PreferredTimeRange {
    @PlanningId
    @Id
    @GeneratedValue
    var id: Long? = null

    lateinit var eventId: String
    lateinit var userId: UUID
    lateinit var hostId: UUID

    var dayOfWeek: DayOfWeek? = null

    lateinit var startTime: LocalTime

    lateinit var endTime: LocalTime

    // No-arg constructor required for Hibernate
    constructor()

    constructor(dayOfWeek: DayOfWeek?, startTime: LocalTime, endTime: LocalTime, eventId: String, userId: UUID,
    hostId: UUID) {
        this.dayOfWeek = dayOfWeek
        this.startTime = startTime
        this.endTime = endTime
        this.eventId = eventId
        this.userId = userId
        this.hostId = hostId
    }

    constructor(id: Long?, dayOfWeek: DayOfWeek?, startTime: LocalTime, endTime: LocalTime, eventId: String, userId: UUID,
    hostId: UUID)
            : this(dayOfWeek, startTime, endTime, eventId, userId, hostId) {
        this.id = id
    }

}