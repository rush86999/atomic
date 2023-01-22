package org.acme.kotlin.atomic.meeting.assist.solver

import org.acme.kotlin.atomic.meeting.assist.domain.EventPart
import org.acme.kotlin.atomic.meeting.assist.domain.User
import org.optaplanner.core.api.score.buildin.hardmediumsoft.HardMediumSoftScore
import org.optaplanner.core.api.score.stream.Constraint
import org.optaplanner.core.api.score.stream.ConstraintCollectors.countDistinct
import org.optaplanner.core.api.score.stream.ConstraintCollectors.sum
import org.optaplanner.core.api.score.stream.ConstraintFactory
import org.optaplanner.core.api.score.stream.ConstraintProvider
import org.optaplanner.core.api.score.stream.Joiners
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.MonthDay

class TimeTableConstraintProvider : ConstraintProvider {

    override fun defineConstraints(constraintFactory: ConstraintFactory): Array<Constraint> {
        return arrayOf(
                // Hard constraints
                userTimeSlotHardConflict(constraintFactory),
                meetingNotSameTimeSlotHardConflict(constraintFactory),
                outOfWorkTimesBoundaryFromStartTimeHardPenalize(constraintFactory),
                outOfWorkTimesBoundaryFromEndTimeHardPenalize(constraintFactory),
                sequentialEventPartsDisconnectedByTimeHardPenalize(constraintFactory),
                eventPartsDisconnectedByTimeHardPenalize(constraintFactory),
                firstAndLastPartDisconnectedByTimeHardPenalize(constraintFactory),
                eventPartsDisconnectedByMonthDayHardPenalize(constraintFactory),
                firstPartPushesLastPartOutHardPenalize(constraintFactory),
                partIsNotFirstForStartOfDayHardPenalize(constraintFactory),
                eventPartsReversedHardPenalize(constraintFactory),
                hardDeadlineConflictHardPenalize(constraintFactory),
                modifiableConflictHardPenalize(constraintFactory),
                notPreferredStartTimeOfTimeRangesHardPenalize(constraintFactory),
                notPreferredEndTimeOfTimeRangesHardPenalize(constraintFactory),
                meetingWithSameEventSlotHardConflict(constraintFactory),

                // Medium constraints
                userTimeSlotMediumConflict(constraintFactory),
                meetingNotSameTimeSlotMediumConflict(constraintFactory),
                outOfWorkTimesBoundaryFromStartTimeMediumPenalize(constraintFactory),
                outOfWorkTimesBoundaryFromEndTimeMediumPenalize(constraintFactory),
                higherPriorityEventsSoonerForTimeOfDayMediumPenalize(constraintFactory),
                positiveImpactTimeScoreMediumPenalize(constraintFactory),
                negativeImpactTimeScoreMediumPenalize(constraintFactory),
                notPreferredDayOfWeekMediumPenalize(constraintFactory),
                notPreferredStartTimeMediumPenalize(constraintFactory),
                notPreferredStartTimeOfTimeRangesMediumPenalize(constraintFactory),
                notPreferredEndTimeOfTimeRangesMediumPenalize(constraintFactory),
                notPreferredScheduleStartTimeRangeMediumPenalize(constraintFactory),
                notPreferredScheduleEndTimeRangeMediumPenalize(constraintFactory),
                externalMeetingModifiableConflictMediumPenalize(constraintFactory),
                meetingModifiableConflictMediumPenalize(constraintFactory),
                backToBackMeetingsPreferredMediumReward(constraintFactory),
                backToBackMeetingsNotPreferredMediumPenalize(constraintFactory),
                backToBackBreakConflictMediumPenalize(constraintFactory),
                maxNumberOfMeetingsConflictMediumPenalize(constraintFactory),
                sequentialEventPartsDisconnectedByTimeMediumPenalize(constraintFactory),
                eventPartsDisconnectedByTimeMediumPenalize(constraintFactory),
                firstAndLastPartDisconnectedByTimeMediumPenalize(constraintFactory),
                eventPartsDisconnectedByMonthDayMediumPenalize(constraintFactory),
                firstPartPushesLastPartOutMediumPenalize(constraintFactory),
                partIsNotFirstForStartOfDayMediumPenalize(constraintFactory),
                eventPartsReversedMediumPenalize(constraintFactory),
                meetingWithSameEventSlotMediumConflict(constraintFactory),


                // Soft constraints
                userTimeSlotSoftConflict(constraintFactory),
                meetingNotSameTimeSlotSoftConflict(constraintFactory),
                outOfWorkTimesBoundaryFromStartTimeSoftPenalize(constraintFactory),
                outOfWorkTimesBoundaryFromEndTimeSoftPenalize(constraintFactory),
                differentMonthDayConflictSoftPenalize(constraintFactory),
                notEqualStartDateForNonTaskSoftPenalize(constraintFactory),
                softDeadlineConflictSoftPenalize(constraintFactory),
                notPreferredStartTimeOfTimeRangesSoftPenalize(constraintFactory),
                notPreferredEndTimeOfTimeRangesSoftPenalize(constraintFactory),
                maxWorkloadConflictSoftPenalize(constraintFactory),
                minNumberOfBreaksConflictSoftPenalize(constraintFactory),
                sequentialEventPartsDisconnectedByTimeSoftPenalize(constraintFactory),
                eventPartsDisconnectedByTimeSoftPenalize(constraintFactory),
                firstAndLastPartDisconnectedByTimeSoftPenalize(constraintFactory),
                eventPartsDisconnectedByMonthDaySoftPenalize(constraintFactory),
                firstPartPushesLastPartOutSoftPenalize(constraintFactory),
                partIsNotFirstForStartOfDaySoftPenalize(constraintFactory),
                eventPartsReversedSoftPenalize(constraintFactory),
                meetingWithSameEventSlotSoftConflict(constraintFactory),
        )
    }

    fun userTimeSlotHardConflict(constraintFactory: ConstraintFactory): Constraint {
        // A user can accommodate at most one event at the same time.
        return constraintFactory
                // Select each pair of 2 different lessons ...
                .forEachUniquePair(
                    EventPart::class.java,
                        // ... in the same timeslot ...
                        Joiners.equal(EventPart::timeslot),
                        // ... in the same user slot ...
                        Joiners.equal(EventPart::userId))
                // ... and penalize each pair with a hard weight.
                .penalize("User timeslot conflict hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun userTimeSlotMediumConflict(constraintFactory: ConstraintFactory): Constraint {
        // A user can accommodate at most one event at the same time.
        return constraintFactory
            // Select each pair of 2 different lessons ...
            .forEachUniquePair(
                EventPart::class.java,
                // ... in the same timeslot ...
                Joiners.equal(EventPart::timeslot),
                // ... in the same room ...
                Joiners.equal(EventPart::userId))
            // ... and penalize each pair with a hard weight.
            .penalize("User timeslot conflict medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun userTimeSlotSoftConflict(constraintFactory: ConstraintFactory): Constraint {
        // A user can accommodate at most one event at the same time.
        return constraintFactory
            // Select each pair of 2 different lessons ...
            .forEachUniquePair(
                EventPart::class.java,
                // ... in the same timeslot ...
                Joiners.equal(EventPart::timeslot),
                // ... in the same room ...
                Joiners.equal(EventPart::userId))
            // ... and penalize each pair with a hard weight.
            .penalize("User timeslot conflict soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun meetingWithSameEventSlotHardConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEachUniquePair(
                EventPart::class.java,
                Joiners.equal(EventPart::timeslot),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (((eventPart1.meetingId != null) && (eventPart2.meetingId == null))
                        || ((eventPart2.meetingId != null) && (eventPart1.meetingId == null)))
            }
            .penalize("Meetings should not be same timeslot as another event penalize hard", HardMediumSoftScore.ONE_HARD)
    }

    fun meetingWithSameEventSlotMediumConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEachUniquePair(
                EventPart::class.java,
                Joiners.equal(EventPart::timeslot),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (((eventPart1.meetingId != null) && (eventPart2.meetingId == null))
                        || ((eventPart2.meetingId != null) && (eventPart1.meetingId == null)))
            }
            .penalize("Meetings should not be same timeslot as another event penalize medium", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun meetingWithSameEventSlotSoftConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEachUniquePair(
                EventPart::class.java,
                Joiners.equal(EventPart::timeslot),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (((eventPart1.meetingId != null) && (eventPart2.meetingId == null))
                        || ((eventPart2.meetingId != null) && (eventPart1.meetingId == null)))
            }
            .penalize("Meetings should not be same timeslot as another event penalize soft", HardMediumSoftScore.ONE_SOFT)
    }

    fun meetingNotSameTimeSlotHardConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.meetingId != null }
            .join(
                EventPart::class.java,
                Joiners.equal(EventPart::meetingId),
                Joiners.equal(EventPart::meetingPart),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.endTime != eventPart2.timeslot?.endTime)
                        || (eventPart1.timeslot?.startTime != eventPart2.timeslot?.startTime)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
            }
            .penalize("Meetings should be same timeslot for each user penalize hard", HardMediumSoftScore.ONE_HARD)
    }

    fun meetingNotSameTimeSlotMediumConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.meetingId != null }
            .filter { eventPart: EventPart -> eventPart.meetingPart > -1 }
            .join(
                EventPart::class.java,
                Joiners.equal(EventPart::meetingId),
                Joiners.equal(EventPart::meetingPart),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.endTime != eventPart2.timeslot?.endTime)
                        || (eventPart1.timeslot?.startTime != eventPart2.timeslot?.startTime)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
            }
            .penalize("Meetings should be same timeslot for each user penalize medium", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun meetingNotSameTimeSlotSoftConflict(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.meetingId != null }
            .join(
                EventPart::class.java,
                Joiners.equal(EventPart::meetingId),
                Joiners.equal(EventPart::meetingPart),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.endTime != eventPart2.timeslot?.endTime)
                        || (eventPart1.timeslot?.startTime != eventPart2.timeslot?.startTime)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
            }
            .penalize("Meetings should be same timeslot for each user penalize soft", HardMediumSoftScore.ONE_SOFT)
    }

    fun outOfWorkTimesBoundaryFromStartTimeHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.startTime < workTime!!.startTime
            }
            .penalize("eventPart is out of bounds from start time hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun outOfWorkTimesBoundaryFromStartTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.startTime < workTime!!.startTime
            }
            .penalize("eventPart is out of bounds from start time medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun outOfWorkTimesBoundaryFromStartTimeSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.startTime < workTime!!.startTime
            }
            .penalize("eventPart is out of bounds from start time soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun outOfWorkTimesBoundaryFromEndTimeHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.endTime > workTime!!.endTime
            }
            .penalize("eventPart is out of bounds from end time hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun outOfWorkTimesBoundaryFromEndTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.endTime > workTime!!.endTime
            }
            .penalize("eventPart is out of bounds from end time medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun outOfWorkTimesBoundaryFromEndTimeSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot!!.endTime > workTime!!.endTime
            }
            .penalize("eventPart is out of bounds from end time soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun sequentialEventPartsDisconnectedByTimeHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val partDiff = eventPart2.part - eventPart1.part
                partDiff == 1
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)



                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() > 0))
            }
            .penalize("Sequential Parts disconnected by time hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun eventPartsDisconnectedByTimeHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.startTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val partDiff = eventPart2.part - eventPart1.part

                val expectedMinutes = partDiff * partDuration.toMinutes()

                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() != expectedMinutes))
            }
            .penalize("Event parts disconnected by time hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun firstAndLastPartDisconnectedByTimeHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.part == 1) && (eventPart2.part == eventPart2.lastPart)
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.endTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val expectedDuration = eventPart1.lastPart * partDuration.toMinutes()

                (between.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (kotlin.math.abs(between.toMinutes() - expectedDuration) > 0))
            }
            .penalize("First and last part disconnected by time for more than 0 min hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun eventPartsDisconnectedByMonthDayHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->

                ((eventPart1.timeslot?.monthDay!! < eventPart2.timeslot?.monthDay)
                        || (eventPart1.timeslot?.monthDay!! > eventPart2.timeslot?.monthDay))
            }
            .penalize("Event parts disconnected by monthDay hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun firstPartPushesLastPartOutHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.part ==  1}
            .filter { eventPart: EventPart -> eventPart.timeslot?.dayOfWeek != null }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)

                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }

                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)
                possibleEndTime!! > workTime!!.endTime

            }
            .penalize("First part pushes last part out of bounds hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun partIsNotFirstForStartOfDayHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.timeslot?.dayOfWeek != null }
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot?.startTime == workTime!!.startTime
            }
            .filter { eventPart: EventPart -> eventPart.part != 1}
            .penalize("Part is not first for start of day hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun eventPartsReversedHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // parts of the same event cannot be reversed
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan((EventPart::part)),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                between.isNegative
            }
            .penalize("Event Parts connected in reverse hard penalize", HardMediumSoftScore.ONE_HARD)

    }

    fun hardDeadlineConflictHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        // hard deadline missed for day of week or time of day
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                (eventPart.hardDeadline != null)
            }
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.hardDeadline?.slice(0..9))
                // 2020-04-02T08:02:17-05:00 - ISO8601 format time
                // 0123456789101112131415161718
                val monthDaySlice = eventPart.hardDeadline?.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)
                val localTime: LocalTime = LocalTime.parse(eventPart.hardDeadline?.slice(11..18))
                (eventPart.timeslot!!.dayOfWeek > date.dayOfWeek)
                        || (eventPart.timeslot!!.monthDay > dateMonthDay)
                        || ((eventPart.timeslot!!.monthDay == dateMonthDay)
                            && (eventPart.timeslot!!.dayOfWeek == date.dayOfWeek)
                            && (eventPart.timeslot!!.endTime > localTime))
            }
            .penalize("missed hard Deadline hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun modifiableConflictHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> !eventPart.modifiable }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.startDate.slice(0..9))
                val localTime: LocalTime = LocalTime.parse(eventPart.startDate.slice(11..18))
                val monthDaySlice = eventPart.startDate.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)
                (localTime > eventPart.timeslot?.startTime)
                        || (localTime < eventPart.timeslot?.startTime)
                        || (date.dayOfWeek < eventPart.timeslot?.dayOfWeek)
                        || (date.dayOfWeek > eventPart.timeslot?.dayOfWeek)
                        || (dateMonthDay < eventPart.timeslot?.monthDay)
                        || (dateMonthDay > eventPart.timeslot?.monthDay)
            }
            .penalize("event is not modifiable but time or day changed hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun higherPriorityEventsSoonerForTimeOfDayMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // higher priority events come sooner during the day
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.greaterThan(EventPart::priority),
                Joiners.equal(EventPart::userId),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.timeslot!!.monthDay > eventPart2.timeslot!!.monthDay)
                        || (eventPart1.timeslot!!.dayOfWeek > eventPart2.timeslot!!.dayOfWeek)
                        || ((eventPart1.timeslot!!.dayOfWeek == eventPart2.timeslot!!.dayOfWeek)
                            && (eventPart1.timeslot!!.monthDay == eventPart2.timeslot!!.monthDay)
                            && (eventPart1.timeslot!!.startTime > eventPart2.timeslot!!.startTime))

            }
            .penalize("Priority comes first for time of day medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun differentMonthDayConflictSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.preferredDayOfWeek == null }
            .filter { eventPart: EventPart -> eventPart.preferredTime == null }
            .filter { eventPart: EventPart -> eventPart.preferredEndTimeRange == null }
            .filter { eventPart: EventPart -> eventPart.preferredStartTimeRange == null }
            .filter { eventPart: EventPart -> eventPart.priority == 1 }
            .filter { eventPart: EventPart -> eventPart.positiveImpactTime == null }
            .filter { eventPart: EventPart -> eventPart.positiveImpactDayOfWeek == null }
            .filter { eventPart: EventPart -> eventPart.negativeImpactTime == null }
            .filter { eventPart: EventPart -> eventPart.negativeImpactDayOfWeek == null }
            .filter { eventPart1: EventPart ->
                // 2020-04-02T08:02:17-05:00 - ISO8601 format time
                // 0123456789101112131415161718
                val monthDaySlice = eventPart1.endDate.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay: MonthDay = MonthDay.parse(monthDayText)
//                print("event1: $event1, $date, eventVal: $eventVal, timeslotVal: $timeslotVal, preferredTime: $preferredTime, preferredDayOfWeek: $preferredDayOfWeek, dailyTaskList: $dailyTaskList, weeklyTaskList: $weeklyTaskList")

                (eventPart1.dailyTaskList || (!(eventPart1.weeklyTaskList)))
                        && ((dateMonthDay > eventPart1.timeslot?.monthDay)
                        || (dateMonthDay < eventPart1.timeslot?.monthDay))
            }
            .penalize("end date monthDay is different from timeslot monthDay soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun notEqualStartDateForNonTaskSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // reward after startDate
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> !(eventPart.dailyTaskList) }
            .filter { eventPart: EventPart -> !(eventPart.weeklyTaskList) }
            .filter { eventPart: EventPart -> !(eventPart.gap) }
            .filter { eventPart: EventPart -> eventPart.forEventId == null }
            .filter { eventPart: EventPart -> eventPart.preferredDayOfWeek == null }
            .filter { eventPart: EventPart -> eventPart.preferredTime == null }
            .filter { eventPart: EventPart -> eventPart.preferredEndTimeRange == null }
            .filter { eventPart: EventPart -> eventPart.preferredStartTimeRange == null }
            .filter { eventPart: EventPart -> eventPart.positiveImpactTime == null }
            .filter { eventPart: EventPart -> eventPart.positiveImpactDayOfWeek == null }
            .filter { eventPart: EventPart -> eventPart.negativeImpactTime == null }
            .filter { eventPart: EventPart -> eventPart.negativeImpactDayOfWeek == null }
            .filter { eventPart: EventPart -> (eventPart.part == 1) }
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.startDate.slice(0..9))
                val localTime: LocalTime = LocalTime.parse(eventPart.startDate.slice(11..18))
                val monthDaySlice = eventPart.startDate.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)


                ((eventPart.timeslot!!.dayOfWeek > date.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek < date.dayOfWeek))
                        || ((eventPart.timeslot!!.startTime < localTime) || (eventPart.timeslot!!.startTime > localTime))
                        || ((eventPart.timeslot!!.monthDay < dateMonthDay) || (eventPart.timeslot!!.monthDay > dateMonthDay))

            }
            .penalize("not equal start date for a non task soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun softDeadlineConflictSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // soft deadline missed for day of week or monthDay or time of day
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                (eventPart.softDeadline != null)
            }
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.softDeadline?.slice(0..9))
                val localTime: LocalTime = LocalTime.parse(eventPart.softDeadline?.slice(11..18))
                val monthDaySlice = eventPart.softDeadline?.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)
                (eventPart.timeslot!!.dayOfWeek > date.dayOfWeek)
                        || (eventPart.timeslot!!.monthDay > dateMonthDay)
                        || ((eventPart.timeslot!!.monthDay == dateMonthDay) && (eventPart.timeslot!!.dayOfWeek == date.dayOfWeek) && (eventPart.timeslot!!.endTime > localTime))
            }
            .penalize("missed soft Deadline soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun positiveImpactTimeScoreMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // impact score preference of timeOfDay and dayOfWeek only if > 0 points

        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                eventPart.positiveImpactScore > 0
            }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart -> eventPart.timeslot?.startTime != null }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }

                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)
                ((eventPart.positiveImpactDayOfWeek!! < eventPart.timeslot?.dayOfWeek) || (eventPart.positiveImpactDayOfWeek!! > eventPart.timeslot?.dayOfWeek))
                        || ((eventPart.positiveImpactTime!! < eventPart.timeslot?.startTime) || (eventPart.positiveImpactTime!! > eventPart.timeslot?.startTime))
                        || (possibleEndTime!! > workTime!!.endTime)

            }
            .penalize("positive impact time score based slot preference not provided medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun negativeImpactTimeScoreMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.negativeImpactScore > 0 }
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .filter { eventPart: EventPart ->
                (eventPart.negativeImpactDayOfWeek == eventPart.timeslot?.dayOfWeek)
                        && (eventPart.negativeImpactTime == eventPart.timeslot?.startTime)

            }
            .penalize("negative impact time score related slot selected medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredDayOfWeekMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.preferredDayOfWeek != null }
            .filter { eventPart: EventPart ->
                (eventPart.preferredDayOfWeek!! < eventPart.timeslot?.dayOfWeek) || (eventPart.preferredDayOfWeek!! > eventPart.timeslot?.dayOfWeek)
            }
            .penalize("preferred dayOfWeek not given medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredStartTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.preferredTime != null }
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)


                (possibleEndTime!! < workTime!!.endTime)
            }
            .filter { eventPart: EventPart -> ((eventPart.preferredTime!! < eventPart.timeslot?.startTime) || (eventPart.preferredTime!! > eventPart.timeslot?.startTime)) }
            .penalize("preferred startTime not given medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredStartTimeOfTimeRangesHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)

                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size) || (possibleEndTime!! > workTime!!.endTime)
            }
            .penalize("timeslot not in preferred start time of preferredTimeRanges hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun notPreferredEndTimeOfTimeRangesHardPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == eventPart.lastPart }
            .filter { eventPart: EventPart -> eventPart.timeslot?.endTime != null }
            .filter { eventPart: EventPart ->

                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size)
            }
            .penalize("timeslot not in preferred end time of preferredTimeRanges hard penalize", HardMediumSoftScore.ONE_HARD)
    }

    fun notPreferredStartTimeOfTimeRangesMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart -> eventPart.timeslot?.startTime != null }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)

                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size) || (possibleEndTime!! > workTime!!.endTime)
            }
            .penalize("timeslot not in preferred start time of preferredTimeRanges medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredEndTimeOfTimeRangesMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == eventPart.lastPart }
            .filter { eventPart: EventPart ->

                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size)
            }
            .penalize("timeslot not in preferred end time of preferredTimeRanges medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredStartTimeOfTimeRangesSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)

                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.startTime < timeRange.startTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size) || (possibleEndTime!! > workTime!!.endTime)
            }
            .penalize("timeslot not in preferred start time of preferredTimeRanges soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun notPreferredEndTimeOfTimeRangesSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges != null }
            .filter { eventPart: EventPart -> eventPart.event.preferredTimeRanges?.size!! > 0 }
            .filter { eventPart: EventPart -> eventPart.part == eventPart.lastPart }
            .filter { eventPart: EventPart ->
                val size = eventPart.event.preferredTimeRanges?.size
                var count = 0
                for (timeRange in eventPart.event.preferredTimeRanges!!) {

                    if (timeRange.dayOfWeek == null) {
                        if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                            count += 1
                        }
                    } else {
                        if ((eventPart.timeslot!!.dayOfWeek < timeRange.dayOfWeek) || (eventPart.timeslot!!.dayOfWeek > timeRange.dayOfWeek)) {
                            count += 1
                        }

                        if (eventPart.timeslot!!.dayOfWeek == timeRange.dayOfWeek) {
                            if (eventPart.timeslot!!.endTime > timeRange.endTime) {
                                count += 1
                            }
                        }
                    }
                }

                (count == size)
            }
            .penalize("timeslot not in preferred end time of preferredTimeRanges soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun notPreferredScheduleStartTimeRangeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> (eventPart.preferredStartTimeRange != null) && (eventPart.preferredEndTimeRange != null) }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"), eventPart.timeslot?.endTime ?: LocalTime.parse("00:15"))
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)

                (eventPart.timeslot!!.startTime < eventPart.preferredStartTimeRange!!)
                        || (possibleEndTime!! > workTime!!.endTime)
            }
            .penalize("timeslot not in preferred start time range medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun notPreferredScheduleEndTimeRangeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> (eventPart.preferredStartTimeRange != null) && (eventPart.preferredEndTimeRange != null) }
            .filter { eventPart: EventPart -> eventPart.part == eventPart.lastPart }
            .filter { eventPart: EventPart ->
                eventPart.timeslot!!.endTime > eventPart.preferredEndTimeRange!!
            }
            .penalize("timeslot not in preferred end time range medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun externalMeetingModifiableConflictMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.isExternalMeeting }
            .filter { eventPart: EventPart -> !eventPart.isExternalMeetingModifiable }
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.startDate.slice(0..9))
                val localTime: LocalTime = LocalTime.parse(eventPart.startDate.slice(11..18))
                val monthDaySlice = eventPart.startDate.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)
                (localTime > eventPart.timeslot?.startTime)
                        || (localTime < eventPart.timeslot?.startTime)
                        || (date.dayOfWeek < eventPart.timeslot?.dayOfWeek)
                        || (date.dayOfWeek > eventPart.timeslot?.dayOfWeek)
                        || (dateMonthDay < eventPart.timeslot?.monthDay)
                        || (dateMonthDay > eventPart.timeslot?.monthDay)
            }
            .penalize("event is an external meeting and not modifiable but time or day was changed medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun meetingModifiableConflictMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> !eventPart.isMeetingModifiable && eventPart.isMeeting }
            .filter { eventPart: EventPart -> eventPart.part == 1 }
            .filter { eventPart: EventPart ->
                val date: LocalDate = LocalDate.parse(eventPart.startDate.slice(0..9))
                val localTime: LocalTime = LocalTime.parse(eventPart.startDate.slice(11..18))
                val monthDaySlice = eventPart.startDate.slice(4..9)
                val monthDayText = "-$monthDaySlice"
                val dateMonthDay = MonthDay.parse(monthDayText)
                (localTime > eventPart.timeslot?.startTime)
                        || (localTime < eventPart.timeslot?.startTime)
                        || (date.dayOfWeek < eventPart.timeslot?.dayOfWeek)
                        || (date.dayOfWeek > eventPart.timeslot?.dayOfWeek)
                        || (dateMonthDay < eventPart.timeslot?.monthDay)
                        || (dateMonthDay > eventPart.timeslot?.monthDay)
            }
            .penalize("event is a meeting and not modifiable but time or day was changed medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun maxWorkloadConflictSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> !eventPart.gap }
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .groupBy(
                { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                EventPart::totalWorkingHours,
                EventPart::user,
                sum { eventPart: EventPart ->
                    Duration
                        .between(
                            LocalTime.parse(eventPart.startDate.slice(11..18)),
                            LocalTime.parse(eventPart.endDate.slice(11..18))
                        ).toMinutes().toInt() }
            )
            .filter{ _, totalWorkingHours: Int, user: User, totalWorkload: Int ->
                val totalWorkLoad1 = totalWorkload.toDouble() / 60
                print("totalWorkingHours: $totalWorkingHours, totalWorkload: $totalWorkLoad1")
                (((totalWorkload.toDouble() / (totalWorkingHours * 60)) * 100) >  user.maxWorkLoadPercent)
            }
            .penalize("exceeded max work load soft penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun backToBackMeetingsPreferredMediumReward(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.user.backToBackMeetings == true }
            .filter { eventPart: EventPart -> (eventPart.isMeeting || eventPart.meetingId != null) }
            .join(EventPart::class.java,
                Joiners.equal { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                Joiners.equal(EventPart::userId)
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                (eventPart1.part == eventPart1.lastPart)
                        && (eventPart2.part == 1)
                        && (eventPart1.groupId != eventPart2.groupId)
                        && !between.isNegative && (between.toMinutes() < 15)
            }
            .reward("user prefers back to back meetings medium reward", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun backToBackMeetingsNotPreferredMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> !eventPart.user.backToBackMeetings }
            .filter { eventPart: EventPart -> eventPart.isMeeting }
            .join(EventPart::class.java,
                Joiners.equal { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                Joiners.equal(EventPart::userId)
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                (eventPart1.part == eventPart1.lastPart)
                        && (eventPart2.part == 1)
                        && (eventPart1.groupId != eventPart2.groupId)
                        && !between.isNegative && between.toMinutes() < 30
            }
            .penalize("user does not prefer back to back meetings medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun backToBackBreakConflictMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.gap }
            .join(EventPart::class.java,
                Joiners.equal { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                Joiners.equal(EventPart::userId)
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                (eventPart1.part == eventPart1.lastPart)
                        && (eventPart2.part == 1)
                        && (eventPart1.groupId != eventPart2.groupId)
                        && !between.isNegative && between.toMinutes() < 30
            }
            .penalize("back to back breaks are not preferred medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun maxNumberOfMeetingsConflictMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter(EventPart::isMeeting)
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .groupBy(
                { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                EventPart::user,
                countDistinct(EventPart::groupId)
            )
            .filter { _, user: User, count: Int ->
                count > user.maxNumberOfMeetings
            }
            .penalize(" max meetings for the day reached medium penalize", HardMediumSoftScore.ONE_MEDIUM)
    }

    fun minNumberOfBreaksConflictSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter(EventPart::gap)
            .filter { eventPart: EventPart -> eventPart.part == 1}
            .groupBy(
                { eventPart: EventPart -> eventPart.timeslot?.monthDay },
                EventPart::user,
                countDistinct(EventPart::groupId)
            )
            .filter { _, user: User, count: Int ->
                (count < user.minNumberOfBreaks) || (count > user.minNumberOfBreaks + 2)
            }
            .penalize("min number of breaks for the day are required penalize", HardMediumSoftScore.ONE_SOFT)
    }

    fun sequentialEventPartsDisconnectedByTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val partDiff = eventPart2.part - eventPart1.part
                partDiff == 1
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)



                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() > 0))
            }
            .penalize("Sequential Parts disconnected by time medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun eventPartsDisconnectedByTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.startTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val partDiff = eventPart2.part - eventPart1.part

                val expectedMinutes = partDiff * partDuration.toMinutes()

                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() != expectedMinutes))
            }
            .penalize("Event parts disconnected by time medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun firstAndLastPartDisconnectedByTimeMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.part == 1) && (eventPart2.part == eventPart2.lastPart)
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.endTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val expectedDuration = eventPart1.lastPart * partDuration.toMinutes()

                (between.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (kotlin.math.abs(between.toMinutes() - expectedDuration) > 0))
            }
            .penalize("First and last part disconnected by time for more than 0 min medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun eventPartsDisconnectedByMonthDayMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->

                ((eventPart1.timeslot?.monthDay!! < eventPart2.timeslot?.monthDay)
                        || (eventPart1.timeslot?.monthDay!! > eventPart2.timeslot?.monthDay))
            }
            .penalize("Event parts disconnected by monthDay medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun firstPartPushesLastPartOutMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.part ==  1}
            .filter { eventPart: EventPart -> eventPart.timeslot?.dayOfWeek != null }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)

                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }

                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)
                possibleEndTime!! > workTime!!.endTime

            }
            .penalize("First part pushes last part out of bounds medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun partIsNotFirstForStartOfDayMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.timeslot?.dayOfWeek != null }
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot?.startTime == workTime!!.startTime
            }
            .filter { eventPart: EventPart -> eventPart.part != 1}
            .penalize("Part is not first for start of day medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun eventPartsReversedMediumPenalize(constraintFactory: ConstraintFactory): Constraint {
        // parts of the same event cannot be reversed
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan((EventPart::part)),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                between.isNegative
            }
            .penalize("Event Parts connected in reverse medium penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun sequentialEventPartsDisconnectedByTimeSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val partDiff = eventPart2.part - eventPart1.part
                partDiff == 1
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)



                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() > 0))
            }
            .penalize("Sequential Parts disconnected by time soft penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun eventPartsDisconnectedByTimeSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val actualBetween = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.startTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val partDiff = eventPart2.part - eventPart1.part

                val expectedMinutes = partDiff * partDuration.toMinutes()

                (actualBetween.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (actualBetween.toMinutes() != expectedMinutes))
            }
            .penalize("Event parts disconnected by time soft penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun firstAndLastPartDisconnectedByTimeSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                (eventPart1.part == 1) && (eventPart2.part == eventPart2.lastPart)
            }
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.startTime,
                    eventPart2.timeslot?.endTime)

                val partDuration = Duration.between(eventPart1.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart1.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val expectedDuration = eventPart1.lastPart * partDuration.toMinutes()

                (between.isNegative
                        || (eventPart1.timeslot?.dayOfWeek != eventPart2.timeslot?.dayOfWeek)
                        || (eventPart1.timeslot?.monthDay != eventPart2.timeslot?.monthDay)
                        || (kotlin.math.abs(between.toMinutes() - expectedDuration) > 0))
            }
            .penalize("First and last part disconnected by time for more than 0 min soft penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun eventPartsDisconnectedByMonthDaySoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan(EventPart::part),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->

                ((eventPart1.timeslot?.monthDay!! < eventPart2.timeslot?.monthDay)
                        || (eventPart1.timeslot?.monthDay!! > eventPart2.timeslot?.monthDay))
            }
            .penalize("Event parts disconnected by monthDay soft penalize", HardMediumSoftScore.ONE_MEDIUM)

    }

    fun firstPartPushesLastPartOutSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart -> eventPart.part ==  1}
            .filter { eventPart: EventPart -> eventPart.timeslot?.dayOfWeek != null }
            .filter { eventPart: EventPart ->
                val totalParts = eventPart.lastPart
                val partDuration = Duration.between(eventPart.timeslot?.startTime ?: LocalTime.parse("00:00"),
                    eventPart.timeslot?.endTime ?: LocalTime.parse("00:15")
                )
                val totalMinutes = totalParts * partDuration.toMinutes()
                val totalDuration = Duration.ofMinutes(totalMinutes)

                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }

                val possibleEndTime = eventPart.timeslot?.startTime?.plus(totalDuration)
                possibleEndTime!! > workTime!!.endTime

            }
            .penalize("First part pushes last part out of bounds soft penalize", HardMediumSoftScore.ONE_SOFT)

    }

    fun partIsNotFirstForStartOfDaySoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // event parts need to be connected together sequentially
        return constraintFactory
            .forEach(EventPart::class.java)
            .filter { eventPart: EventPart ->
                val workTime = eventPart.user.workTimes.find { it -> it.dayOfWeek == eventPart.timeslot!!.dayOfWeek }
                eventPart.timeslot?.startTime == workTime!!.startTime
            }
            .filter { eventPart: EventPart -> eventPart.part != 1}
            .penalize("Part is not first for start of day soft penalize", HardMediumSoftScore.ONE_SOFT)

    }

    fun eventPartsReversedSoftPenalize(constraintFactory: ConstraintFactory): Constraint {
        // parts of the same event cannot be reversed
        return constraintFactory
            .forEach(EventPart::class.java)
            .join(EventPart::class.java,
                Joiners.equal(EventPart::groupId),
                Joiners.lessThan((EventPart::part)),
            )
            .filter { eventPart1: EventPart, eventPart2: EventPart ->
                val between = Duration.between(eventPart1.timeslot?.endTime,
                    eventPart2.timeslot?.startTime)

                between.isNegative
            }
            .penalize("Event Parts connected in reverse soft penalize", HardMediumSoftScore.ONE_SOFT)

    }


}
