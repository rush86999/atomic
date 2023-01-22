package org.acme.kotlin.atomic.meeting.assist.rest

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.node.NullNode
import io.quarkus.panache.common.Sort
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import org.acme.kotlin.atomic.meeting.assist.domain.*
import org.acme.kotlin.atomic.meeting.assist.persistence.*
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.http4k.client.OkHttp
import org.http4k.core.*
import org.http4k.filter.ClientFilters
import org.http4k.format.Jackson
import org.http4k.format.Jackson.asJsonObject
import org.http4k.format.Jackson.asJsonValue
import org.http4k.format.Jackson.json
import org.optaplanner.core.api.score.ScoreManager
import org.optaplanner.core.api.score.buildin.hardmediumsoft.HardMediumSoftScore
import org.optaplanner.core.api.solver.SolverManager
import java.util.*
import javax.annotation.security.RolesAllowed
import javax.inject.Inject
import javax.transaction.Transactional
import javax.ws.rs.*


data class PostTableRequestBody(
    @field:JsonProperty("singletonId")
    var singletonId: UUID? = null,
    @field:JsonProperty("hostId")
    var hostId: UUID? = null,
    @field:JsonProperty("timeslots")
    var timeslots: MutableList<Timeslot>? = null,
    @field:JsonProperty("userList")
    var userList: MutableList<User>? = null,
    @field:JsonProperty("eventParts")
    var eventParts: MutableList<EventPart>? = null,
    var fileKey: String,
    val delay: Long,
    val callBackUrl: String,
)

data class PostStopSingletonRequestBody(
    @field:JsonProperty("singletonId")
    var singletonId: UUID? = null,
)


@Path("/timeTable")
class TimeTableResource {

    private var singletonId: UUID? = null
    var hostId: UUID? = null
    var fileKey: String? = null

    @ConfigProperty(name = "username")
    lateinit var username: String

    @ConfigProperty(name = "password")
    lateinit var password: String

    @Inject
    lateinit var timeslotRepository: TimeslotRepository
    @Inject
    lateinit var userRepository: UserRepository
    @Inject
    lateinit var eventPartRepository: EventPartRepository
    @Inject
    lateinit var workTimeRepository: WorkTimeRepository

    @Inject
    lateinit var preferredTimeRangeRepository: PreferredTimeRangeRepository

    @Inject
    lateinit var eventRepository: EventRepository

    @Inject
    lateinit var solverManager: SolverManager<TimeTable, UUID>

    @Inject
    lateinit var scoreManager: ScoreManager<TimeTable, HardMediumSoftScore>


    @GET
    @Path("/user/byId/{id}")
    fun getTimeTableById(@PathParam("id") id: UUID): TimeTable {
        // Get the solver status before loading the solution
        // to avoid the race condition that the solver terminates between them
//        val solverStatus = getSolverStatus()
        print("singletonId: $singletonId, id: $id")
        check(id == this.singletonId) { "value of id is not same as timetable: ($id)"}
        val solution: TimeTable = findById(id)
        scoreManager.updateScore(solution) // Sets the score
//        solution.solverStatus = solverStatus
        return solution
    }

    @GET
    @Path("/admin/byId/{id}")
    @RolesAllowed("admin")
    fun adminGetTimeTableById(@PathParam("id") id: UUID): TimeTable {
        // Get the solver status before loading the solution
        // to avoid the race condition that the solver terminates between them
//        val solverStatus = getSolverStatus()
        print("singletonId: $singletonId, id: $id")
        check(id == this.singletonId) { "value of id $id is not same as timetable: (${this.singletonId})"}
        val solution: TimeTable = findById(id)
        scoreManager.updateScore(solution) // Sets the score
//        solution.solverStatus = solverStatus
        return solution
    }

    @Transactional
    protected fun findById(id: UUID): TimeTable {
        check(singletonId == id) { "There is no timeTable with id ($id)." }
        // Occurs in a single transaction, so each initialized lesson references the same timeslot/room instance
        // that is contained by the timeTable's timeslotList/roomList.
        check(hostId !== null) { "hostId is null ($hostId)" }
//        solverManager.terminateEarly(singletonId)
        val savedTimeslots = timeslotRepository.list("hostId", Sort.by("dayOfWeek").and("startTime").and("endTime").and("id"), hostId!!)
        print("savedTimeslots: $savedTimeslots")

        val savedEvents = eventPartRepository.list("hostId", Sort.by("startDate").and("endDate").and("id"), hostId)
        return TimeTable(
            savedTimeslots,
//            userRepository.list("hostId", hostId),
            savedEvents,
        )
    }

    @Transactional
    fun callAPI(callBackUrl: String) {
        val client = OkHttp()
        val clientHandler: HttpHandler = ClientFilters.BasicAuth(username, password).then(client)

        val table: TimeTable? = hostId?.let {
            timeslotRepository.list(
                "hostId",
                Sort.by("dayOfWeek").and("startTime").and("endTime").and("id"),
                it
            )
        }?.let {
            TimeTable(
                it,
//                userRepository.list("hostId", hostId),
                eventPartRepository.list("hostId", Sort.by("startDate").and("endDate").and("id"), hostId),
            )
        }
        // manual convert to json
        val timeslots = hostId?.let {
            timeslotRepository.list(
                "hostId",
                Sort.by("dayOfWeek").and("startTime").and("endTime").and("id"),
                it
            )
        }
        val timeslotList = (timeslots?.map { timeslot ->
            Jackson.obj(
                "id" to timeslot.id.asJsonValue(),
                "hostId" to timeslot.hostId.toString().asJsonValue(),
                "dayOfWeek" to timeslot.dayOfWeek.toString().asJsonValue(),
                "startTime" to timeslot.startTime.toString().asJsonValue(),
                "endTime" to timeslot.endTime.toString().asJsonValue(),
                "monthDay" to timeslot.monthDay.toString().asJsonValue()
            )

        })?.asJsonObject()



        val userObjects = userRepository.list("hostId", hostId)
        val users = (userObjects?.map { userObject ->
            Jackson.obj(
                    "id" to userObject.id.toString().asJsonValue(),
                    "hostId" to userObject.hostId.toString().asJsonValue(),
                    "maxWorkLoadPercent" to userObject.maxWorkLoadPercent.asJsonValue(),
                    "backToBackMeetings" to userObject.backToBackMeetings.asJsonValue(),
                    "maxNumberOfMeetings" to userObject.maxNumberOfMeetings.asJsonValue(),
                    "workTimes" to (userObject.workTimes.map { workTime ->
                        Jackson.obj(
                            "id" to workTime.id.asJsonValue(),
                            "userId" to workTime.userId.toString().asJsonValue(),
                            "hostId" to workTime.hostId.toString().asJsonValue(),
                            "startTime" to workTime.startTime.toString().asJsonValue(),
                            "endTime" to workTime.endTime.toString().asJsonValue()
                        )
                    }).asJsonObject()
                )
            })?.asJsonObject()

            val eventParts = eventPartRepository.list("hostId", Sort.by("startDate").and("endDate").and("id"), hostId)

            val eventPartList = (eventParts.map { eventPart ->
//                val userIndex = userObjects.binarySearch { if (it.id == eventPart.userId) 0 else 1 }
//                print("$userIndex: userIndex")
                val saveUser = userRepository.find("id", eventPart.userId).firstResult<User>()
                Jackson.obj(
                    "id" to eventPart.id.toString().asJsonValue(),
                    "groupId" to eventPart.groupId.asJsonValue(),
                    "eventId" to eventPart.eventId.asJsonValue(),
                    "part" to eventPart.part.asJsonValue(),
                    "lastPart" to eventPart.lastPart.asJsonValue(),
                    "startDate" to eventPart.startDate.asJsonValue(),
                    "endDate" to eventPart.endDate.asJsonValue(),
                    "taskId" to (eventPart?.taskId?.asJsonValue() ?: NullNode.instance),
                    "softDeadline" to (eventPart?.softDeadline?.asJsonValue() ?: NullNode.instance),
                    "hardDeadline" to (eventPart?.hardDeadline?.asJsonValue() ?: NullNode.instance),
                    "meetingId" to (eventPart?.meetingId?.asJsonValue() ?: NullNode.instance),
                    "userId" to eventPart.userId.toString().asJsonValue(),
                    "hostId" to eventPart.hostId.toString().asJsonValue(),
                    "user" to saveUser.asJsonObject(),
                    "priority" to eventPart.priority.asJsonValue(),
                    "isPreEvent" to (eventPart?.isPreEvent?.asJsonValue() ?: NullNode.instance),
                    "isPostEvent" to (eventPart?.isPostEvent?.asJsonValue() ?: NullNode.instance),
                    "forEventId" to (eventPart?.forEventId?.asJsonValue() ?: NullNode.instance),
                    "positiveImpactScore" to eventPart.positiveImpactScore.asJsonValue(),
                    "negativeImpactScore" to eventPart.negativeImpactScore.asJsonValue(),
                    "positiveImpactDayOfWeek" to (eventPart?.positiveImpactDayOfWeek?.toString()?.asJsonValue()
                        ?: NullNode.instance),
                    "positiveImpactTime" to (eventPart?.positiveImpactTime?.toString()?.asJsonValue() ?: NullNode.instance),
                    "negativeImpactDayOfWeek" to (eventPart?.negativeImpactDayOfWeek?.toString()?.asJsonValue()
                        ?: NullNode.instance),
                    "negativeImpactTime" to (eventPart?.negativeImpactTime?.toString()?.asJsonValue() ?: NullNode.instance),
                    "modifiable" to eventPart.modifiable.asJsonValue(),
                    "preferredDayOfWeek" to (eventPart?.preferredDayOfWeek?.toString()?.asJsonValue() ?: NullNode.instance),
                    "preferredTime" to (eventPart?.preferredTime?.toString()?.asJsonValue() ?: NullNode.instance),
                    "isExternalMeeting" to eventPart.isExternalMeeting.asJsonValue(),
                    "isExternalMeetingModifiable" to eventPart.isExternalMeetingModifiable.asJsonValue(),
                    "isMeetingModifiable" to eventPart.isMeetingModifiable.asJsonValue(),
                    "isMeeting" to eventPart.isMeeting.asJsonValue(),
                    "dailyTaskList" to eventPart.dailyTaskList.asJsonValue(),
                    "weeklyTaskList" to eventPart.weeklyTaskList.asJsonValue(),
                    "gap" to eventPart.gap.asJsonValue(),
                    "preferredStartTimeRange" to (eventPart?.preferredStartTimeRange?.toString()?.asJsonValue()
                        ?: NullNode.instance),
                    "preferredEndTimeRange" to (eventPart?.preferredEndTimeRange?.toString()?.asJsonValue()
                        ?: NullNode.instance),
                    "totalWorkingHours" to eventPart.totalWorkingHours.asJsonValue(),
                    "event" to Jackson.obj(
                        "id" to eventPart.event.id.asJsonValue(),
                        "userId" to eventPart.event.userId.toString().asJsonValue(),
                        "hostId" to eventPart.hostId.toString().asJsonValue(),
                        "preferredTimeRanges" to ((eventPart.event.preferredTimeRanges?.map { preferredTimeRange ->
                            Jackson.obj(
                                "id" to preferredTimeRange.id.asJsonValue(),
                                "eventId" to preferredTimeRange.eventId.asJsonValue(),
                                "userId" to preferredTimeRange.userId.toString().asJsonValue(),
                                "hostId" to preferredTimeRange.hostId.toString().asJsonValue(),
                                "dayOfWeek" to (preferredTimeRange.dayOfWeek?.toString()?.asJsonValue()
                                    ?: NullNode.instance),
                                "startTime" to preferredTimeRange.startTime.toString().asJsonValue(),
                                "endTime" to preferredTimeRange.endTime.toString().asJsonValue(),
                            )
                        })?.asJsonObject() ?: NullNode.instance)
                    ),
                    "timeslot" to Jackson.obj(
                        "id" to eventPart.timeslot?.id.asJsonValue(),
                        "hostId" to eventPart.timeslot?.hostId.toString().asJsonValue(),
                        "dayOfWeek" to eventPart.timeslot?.dayOfWeek.toString().asJsonValue(),
                        "startTime" to eventPart.timeslot?.startTime.toString().asJsonValue(),
                        "endTime" to eventPart.timeslot?.endTime.toString().asJsonValue(),
                        "monthDay" to eventPart.timeslot?.monthDay.toString().asJsonValue()
                    )
                )
            }).asJsonObject()

            val body = timeslotList?.let { it ->
                    users?.let { it1 ->
                        Jackson.obj(
                            "timeslotList" to it,
                            "userList" to it1,
                            "eventPartList" to eventPartList,
                            "score" to (table?.score?.toString()?.asJsonValue() ?: NullNode.instance),
                            "fileKey" to fileKey.asJsonValue(),
                            "hostId" to hostId.toString().asJsonValue(),
                        )
                    }
            }

            hostId?.let { deleteTableGivenUser(it) }

            val tableLens = Body.json().toLens()
            val response = body?.let { tableLens(it, Request(Method.POST, callBackUrl)) }?.let { clientHandler(it) }
            print("this is  response $response")
            print("status ${response?.status}")
            print("body ${response?.bodyString()}")
        }

    @Transactional
    fun deleteTableGivenUser(
        hostId: UUID,
    ) {
        this.singletonId = null
        this.eventPartRepository.delete("hostId", hostId)
        this.workTimeRepository.delete("hostId", hostId)
        this.userRepository.delete("hostId", hostId)
        this.timeslotRepository.delete("hostId", hostId)
        this.preferredTimeRangeRepository.delete("hostId", hostId)
        this.eventRepository.delete("hostId", hostId)
    }


    suspend fun callBackAPI(singletonId: UUID, delay: Long, callBackUrl: String) {
        kotlinx.coroutines.delay(delay)
        solverManager.terminateEarly(singletonId)
        callAPI(callBackUrl)
    }

    fun solve(delay: Long, callBackUrl: String) {
        check(singletonId !== null) {"singletonId is null $singletonId"}

        solverManager.solveAndListen(singletonId,
            this::findById,
            this::save)

        GlobalScope.launch {
            singletonId?.let { callBackAPI(it, delay, callBackUrl) }
        }

    }

    @Transactional
    fun createTableAndSolve(
        singletonId: UUID,
        hostId: UUID,
        timeslots: MutableList<Timeslot>,
        userList: MutableList<User>,
        eventParts: MutableList<EventPart>,
        fileKey: String,
        delay: Long,
        callBackUrl: String,
    ) {

        this.singletonId = singletonId
        this.hostId = hostId
        this.fileKey = fileKey
        this.timeslotRepository.persist(timeslots)
        val savedTimeslots = timeslotRepository.list("hostId", hostId)
        print("savedTimeslots: $savedTimeslots")
        this.userRepository.persist(userList)
        val savedUsers = userRepository.list("hostId", hostId)
        print("savedUsers: $savedUsers")
        savedUsers.forEach { workTimeRepository.persist(it.workTimes) }

        val savedWorkTimes = workTimeRepository.list("hostId", hostId)
        print("savedWorkTimes: $savedWorkTimes")
        print("eventParts: $eventParts")
        eventParts.forEach { eventPart: EventPart ->
//            val index = savedUsers.binarySearch { if (it.id == eventPart.userId) 0 else 1 }
//            print("$index: index for binarySearch of users")
            val savedUser = userRepository.find("id", eventPart.userId).firstResult<User>()
            print("savedUser: $savedUser")
            eventPart.user = savedUser
//            event.workTimes = savedWorkTimes
        }
        var events: MutableList<Event> = mutableListOf()
        eventParts.forEach { e: EventPart -> events.add(e.event) }
        val distinctEvents = events.distinctBy { e: Event -> e.id }
        eventRepository.persist(distinctEvents)
        var preferredTimesRanges: MutableList<PreferredTimeRange> = mutableListOf()
        eventParts.forEach { e: EventPart -> e.event.preferredTimeRanges?.forEach { pt: PreferredTimeRange -> preferredTimesRanges.add(pt) } }
        val distinctPreferredTimeRanges = preferredTimesRanges.distinctBy { pt: PreferredTimeRange -> listOf(pt.dayOfWeek, pt.startTime, pt.endTime, pt.eventId) }
        preferredTimeRangeRepository.persist(distinctPreferredTimeRanges)

        // list saved events and preferredTimeRanges
        eventParts.forEach { e: EventPart ->
            val savedEvent = eventRepository.find("id", e.eventId).firstResult<Event>()
            e.event = savedEvent
        }

        eventPartRepository.persist(eventParts)
        val savedEventParts = eventPartRepository.list("hostId", Sort.by("startDate").and("endDate").and("id"), hostId)
        print("savedEvents: $savedEventParts")


        solve(delay, callBackUrl)
    }

    @Transactional
    protected fun save(timeTable: TimeTable) {
        if (timeTable == null) {
            print("timeTable is null")
            return
        }
        for (eventPart in timeTable.eventPartList) {
            // TODO this is awfully naive: optimistic locking causes issues if called by the SolverManager
            val attachedEventPart: EventPart = eventPartRepository.findById(eventPart.id!!)!!
            attachedEventPart.timeslot = eventPart.timeslot
        }

    }

    @POST
    @Path("/user/stopSolving")
    fun stopSolving(
        args: PostStopSingletonRequestBody,
    ) {
        solverManager.terminateEarly(args.singletonId)
    }

    @POST
    @Path("/admin/stopSolving")
    @RolesAllowed("admin")
    fun adminStopSolving(
        args: PostStopSingletonRequestBody,
    ) {
        solverManager.terminateEarly(args.singletonId)
    }


    @POST
    @Path("/user/solve-day")
    fun solveDay(args: PostTableRequestBody) {
        print("args: $args")
        if (singletonId != null) {
            args.singletonId?.let { args.hostId?.let { it1 -> deleteTableGivenUser(it1) } }
        }
        args.singletonId?.let { it ->
            args.hostId?.let { it1 ->
                args.timeslots?.let { it2 ->
                    args.userList?.let { it3 ->
                        args.eventParts?.let { it4 ->
                            createTableAndSolve(
                                it, it1, it2, it3, it4, args.fileKey, args.delay, args.callBackUrl,
                            )
                        }
                    }
                }
            }
        }
    }

    @POST
    @Path("/admin/solve-day")
    @RolesAllowed("admin")
    fun adminSolveDay(args: PostTableRequestBody) {
        print("args: $args")
        if (singletonId != null) {
            args.singletonId?.let { args.hostId?.let { it1 -> deleteTableGivenUser(it1) } }
        }
        args.singletonId?.let {
            args.hostId?.let { it1 ->
                args.timeslots?.let { it2 ->
                    args.userList?.let { it3 ->
                        args.eventParts?.let { it4 ->
                            createTableAndSolve(
                                it, it1, it2, it3, it4, args.fileKey, args.delay, args.callBackUrl,
                            )
                        }
                    }
                }
            }
        }
    }

    @DELETE
    @Path("/user/delete/{id}")
    fun deleteTable(
        @PathParam("id") id: UUID,
    ) {
        deleteTableGivenUser(id)
    }

    @DELETE
    @Path("/admin/delete/{id}")
    @RolesAllowed("admin")
    fun adminDeleteTable(
        @PathParam("id") id: UUID,
    ) {
        deleteTableGivenUser(id)
    }

}
