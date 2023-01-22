package org.acme.kotlin.atomic.meeting.assist.domain

import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty
import org.optaplanner.core.api.domain.solution.PlanningScore
import org.optaplanner.core.api.domain.solution.PlanningSolution
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider
import org.optaplanner.core.api.solver.SolverStatus
import org.optaplanner.core.api.score.buildin.hardmediumsoft.HardMediumSoftScore


@PlanningSolution
class TimeTable {

    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = "timeslotRange")
    lateinit var timeslotList: List<Timeslot>

//    @ProblemFactCollectionProperty
//    lateinit var userList: List<User>

    @PlanningEntityCollectionProperty
    lateinit var eventPartList: List<EventPart>

    @PlanningScore
    var score: HardMediumSoftScore? = null

    // Ignored by OptaPlanner, used by the UI to display solve or stop solving button
    var solverStatus: SolverStatus? = null

    // No-arg constructor required for OptaPlanner
    constructor() {}

    constructor(timeslotList: List<Timeslot>, eventPartList: List<EventPart>) {
        this.timeslotList = timeslotList
//        this.userList = userList
        this.eventPartList = eventPartList
    }

}
