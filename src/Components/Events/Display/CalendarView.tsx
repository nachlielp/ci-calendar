import utc from "dayjs/plugin/utc"
import ConfigProvider from "antd/es/config-provider"
import Calendar, { CalendarProps } from "antd/es/calendar"
import type { Dayjs } from "dayjs"
import { CIEvent } from "../../../util/interfaces"
import isBetween from "dayjs/plugin/isBetween"
import dayjs from "dayjs"
import "dayjs/locale/he"
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.locale("he")
import hb from "antd/locale/he_IL"
import { useState } from "react"
import { Icon } from "../../Common/Icon"
import "../../../styles/calendar-view.css"

interface CalendarViewProps {
    events: CIEvent[]
    onSelect: (value: Dayjs) => void
}

export default function CalendarView({ events, onSelect }: CalendarViewProps) {
    const [value, setValue] = useState<Dayjs>(dayjs())

    const onChange = (newValue: Dayjs) => {
        setValue(newValue)
    }

    const dateCellRender = (current: Dayjs) => {
        const eventCount = eventsOnDay(current, events).length
        const isToday = current.isSame(dayjs(), "day")
        const isDisabled = !eventsOnDay(current, events).length

        return (
            <div
                className={`calendar-view__day-cell ${isToday && "today"} ${
                    isDisabled && "disabled"
                } ${eventCount > 0 && "has-events-" + eventCount}`}
            >
                <span>{current.date()}</span>
                <div className="event-dots">
                    {Array.from({ length: Math.min(eventCount, 5) }).map(
                        (_, index) => (
                            <span key={index} className="event-dot"></span>
                        )
                    )}
                </div>
            </div>
        )
    }

    const cellRender: CalendarProps<Dayjs>["cellRender"] = (day, info) => {
        if (info.type === "date") return dateCellRender(day)
        return info.originNode
    }

    const prevMonth = () => {
        const newValue = value.subtract(1, "month")
        const oneMonthAgo = dayjs().subtract(1, "month").startOf("month")
        if (newValue.isAfter(oneMonthAgo)) {
            setValue(newValue)
        }
    }

    const nextMonth = () => {
        const newValue = value.add(1, "month")
        const threeMonthsAhead = dayjs().add(3, "months").endOf("month")
        if (newValue.isBefore(threeMonthsAhead)) {
            setValue(newValue)
        }
    }

    return (
        <section className="calendar-view">
            <header className="calendar-controller">
                <Icon
                    onClick={prevMonth}
                    icon="chevron_right"
                    className="back"
                />
                <label className="label">{value.format("MMMM YYYY")}</label>
                <Icon
                    onClick={nextMonth}
                    icon="chevron_right"
                    className="next"
                />
            </header>
            <section className="calendar-view__card card">
                <ConfigProvider locale={hb} direction="rtl">
                    <Calendar
                        value={value}
                        mode="month"
                        onChange={onChange}
                        fullscreen={false}
                        fullCellRender={cellRender}
                        onSelect={onSelect}
                        headerRender={() => <div></div>}
                    />
                </ConfigProvider>
            </section>
        </section>
    )
}

function eventsOnDay(day: Dayjs, events: CIEvent[]) {
    return events.filter((event) => {
        if (event.is_multi_day) {
            return day.isBetween(
                dayjs(event.start_date).startOf("day"),
                dayjs(event.end_date).endOf("day"),
                null,
                "[]"
            )
        }
        return day.isSame(dayjs(event.start_date), "day")
    })
}
