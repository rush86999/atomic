package org.acme.kotlin.atomic.meeting.assist.domain

import org.hibernate.type.descriptor.WrapperOptions
import org.hibernate.type.descriptor.java.AbstractTypeDescriptor
import org.hibernate.type.descriptor.java.ImmutableMutabilityPlan
import java.time.MonthDay

class MonthDayDescriptor: AbstractTypeDescriptor<MonthDay>(MonthDay::class.java, ImmutableMutabilityPlan()) {
    override fun toString(value: MonthDay): String {
        return value.toString()
    }

    override fun fromString(string: String): MonthDay {
        return MonthDay.parse(string)
    }

    override fun <X> unwrap(value: MonthDay, type: Class<X>, options: WrapperOptions): X {
        if (value == null) {
            return null as X
        }

        if (value.toString() is String) {
            return value.toString() as X
        }

        throw unknownUnwrap(type)
    }

    override fun <X> wrap(value: X, options: WrapperOptions): MonthDay {
        if (MonthDay.parse(value as String) is MonthDay) {
            return MonthDay.parse(value as String)
        }
        throw unknownWrap(value!!::class.java)
    }

}