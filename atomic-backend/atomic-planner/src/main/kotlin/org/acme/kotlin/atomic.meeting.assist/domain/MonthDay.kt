package org.acme.kotlin.atomic.meeting.assist.domain
import org.hibernate.type.AbstractSingleColumnStandardBasicType
import org.hibernate.type.descriptor.sql.VarcharTypeDescriptor
import java.time.MonthDay


class MonthDay : AbstractSingleColumnStandardBasicType<MonthDay>(VarcharTypeDescriptor(), MonthDayDescriptor()) {

    override fun getName(): String = "MonthDay"


}