package org.acme.kotlin.atomic.meeting.assist.domain

import org.optaplanner.core.api.domain.lookup.PlanningId
import java.util.*
import javax.persistence.*

@Entity
@Table(name="user_optaplanner", indexes = [
    Index(name = "sk_hostId_user_optaplanner", columnList = "hostId"),
])
class User {
    @PlanningId
    @Id
    lateinit var id: UUID

    lateinit var hostId: UUID

    var maxWorkLoadPercent: Int = 85
    var backToBackMeetings: Boolean = false
    var maxNumberOfMeetings: Int = 8
    var minNumberOfBreaks: Int = 0

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "userId", referencedColumnName = "id", insertable = false, updatable = false)
    lateinit var workTimes: MutableList<WorkTime>


    // No-arg constructor required for Hibernate and OptaPlanner
    constructor()

    constructor(id: UUID,
                hostId: UUID,
                maxWorkLoadPercent: Int,
                backToBackMeetings: Boolean,
                maxNumberOfMeetings: Int,
                minNumberOfBreaks: Int,
                workTimes: MutableList<WorkTime>,
    ) {
        this.id = id
        this.hostId = hostId
        this.maxWorkLoadPercent = maxWorkLoadPercent
        this.backToBackMeetings = backToBackMeetings
        this.maxNumberOfMeetings = maxNumberOfMeetings
        this.minNumberOfBreaks = minNumberOfBreaks
        this.workTimes = workTimes
    }
}