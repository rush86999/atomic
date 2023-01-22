package org.acme.kotlin.atomic.meeting.assist.domain
import org.hibernate.annotations.Fetch
import org.hibernate.annotations.FetchMode
import org.optaplanner.core.api.domain.lookup.PlanningId
import java.util.*
import javax.persistence.*

@Entity
@Table(name="event_optaplanner", indexes = [
    Index(name = "sk_userId_event_optaplanner", columnList = "userId"),
    Index(name = "sk_hostId_event_optaplanner", columnList = "hostId"),
])
class Event {
    @PlanningId
    @Id
    lateinit var id: String

    lateinit var userId: UUID

    lateinit var hostId: UUID

    @OneToMany(fetch = FetchType.EAGER)
    @Fetch(value = FetchMode.SUBSELECT)
    @JoinColumn(name = "eventId", referencedColumnName = "id", insertable = false, updatable = false)
    var preferredTimeRanges: MutableList<PreferredTimeRange>? = null


    // No-arg constructor required for Hibernate and Opta Planner
    constructor()

    constructor(id: String, preferredTimeRanges: MutableList<PreferredTimeRange>?, userId: UUID, hostId: UUID) {
        this.id = id
        this.preferredTimeRanges = preferredTimeRanges
        this.userId = userId
        this.hostId = hostId
    }

}