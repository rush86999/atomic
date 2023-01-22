package org.acme.kotlin.atomic.meeting.assist.domain

import org.hibernate.annotations.Type
import org.optaplanner.core.api.domain.lookup.PlanningId
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.*
import javax.persistence.*
import java.time.MonthDay


@Entity
@Table(name="timeslot_optaplanner", indexes = [
    Index(name = "sk_timeslot_hostId_optaplanner", columnList = "hostId"),
])
class Timeslot {
    @PlanningId
    @Id
    @GeneratedValue
    var id: Long? = null

    var hostId: UUID? = null

    lateinit var dayOfWeek: DayOfWeek
    lateinit var startTime: LocalTime
    lateinit var endTime: LocalTime
    @Type(type = "org.acme.kotlin.atomic.meeting.assist.domain.MonthDay")
    lateinit var monthDay: MonthDay

    // No-arg constructor required for Hibernate
    constructor()

    constructor(dayOfWeek: DayOfWeek, startTime: LocalTime, endTime: LocalTime, monthDay: MonthDay, userId: UUID?) {
        this.dayOfWeek = dayOfWeek
        this.startTime = startTime
        this.endTime = endTime
        this.hostId = userId
        this.monthDay = monthDay
    }

    constructor(id: Long?, dayOfWeek: DayOfWeek, startTime: LocalTime, endTime: LocalTime, monthDay: MonthDay, userId: UUID?)
            : this(dayOfWeek, startTime, endTime, monthDay, userId) {
        this.id = id
    }

    override fun toString(): String = "$dayOfWeek $startTime"

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Timeslot
        if (dayOfWeek != other.dayOfWeek) return false
        if (startTime != other.startTime) return false
        if (endTime != other.endTime) return false
        if (monthDay != other.monthDay) return false
        if (hostId != other.hostId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = dayOfWeek.hashCode()
        result = 31 * result + monthDay.hashCode()
        result = 31 * result + endTime.hashCode()
        result = 31 * result + startTime.hashCode()
        result = 31 * result + hostId.hashCode()
        return result
    }

}
