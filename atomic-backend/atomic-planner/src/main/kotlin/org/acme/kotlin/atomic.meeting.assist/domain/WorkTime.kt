package org.acme.kotlin.atomic.meeting.assist.domain
import org.optaplanner.core.api.domain.lookup.PlanningId
import java.time.DayOfWeek
import java.time.LocalTime
import java.util.*
import javax.persistence.*

@Entity
@Table(name="workTime_optaplanner", indexes = [
    Index(name = "sk_userId_workTime_optaplanner", columnList = "userId"),
    Index(name = "sk_hostId_workTime_optaplanner", columnList = "hostId"),
])
class WorkTime {
    @PlanningId
    @Id
    @GeneratedValue
    var id: Long? = null

    lateinit var userId: UUID
    lateinit var hostId: UUID
    lateinit var dayOfWeek: DayOfWeek

    lateinit var startTime: LocalTime

    lateinit var endTime: LocalTime

    // No-arg constructor required for Hibernate
    constructor()

    constructor(dayOfWeek: DayOfWeek, startTime: LocalTime, endTime: LocalTime, userId: UUID, hostId: UUID) {
        this.dayOfWeek = dayOfWeek
        this.startTime = startTime
        this.endTime = endTime
        this.userId = userId
        this.hostId = hostId
    }

    constructor(id: Long?, dayOfWeek: DayOfWeek, startTime: LocalTime, endTime: LocalTime, userId: UUID, hostId: UUID)
            : this(dayOfWeek, startTime, endTime, userId, hostId) {
        this.id = id
    }

}