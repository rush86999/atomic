package org.acme.kotlin.atomic.meeting.assist.persistence

import io.quarkus.hibernate.orm.panache.PanacheRepository
import org.acme.kotlin.atomic.meeting.assist.domain.EventPart
import javax.enterprise.context.ApplicationScoped

@ApplicationScoped
class EventPartRepository : PanacheRepository<EventPart>