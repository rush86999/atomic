package org.acme.kotlin.atomic.meeting.assist.persistence

import io.quarkus.hibernate.orm.panache.PanacheRepository
import org.acme.kotlin.atomic.meeting.assist.domain.User
import java.util.*
import javax.enterprise.context.ApplicationScoped

@ApplicationScoped
class UserRepository : PanacheRepository<User>