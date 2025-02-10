import utc from "dayjs/plugin/utc"
import ConfigProvider from "antd/es/config-provider"
import Calendar, { CalendarProps } from "antd/es/calendar"
import type { Dayjs } from "dayjs"
import { CIEvent } from "../../../util/interfaces"
import isBetween from "dayjs/plugin/isBetween"
import dayjs from "dayjs"
import "dayjs/locale/en"
import hb from "antd/locale/he_IL"
import en from "antd/locale/en_US"
import ru from "antd/locale/ru_RU"
// import "dayjs/locale/he"
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.locale("en")
// import hb from "antd/locale/he_IL"
import { useState } from "react"
import { Icon } from "../../Common/Icon"
import "../../../styles/calendar-view.scss"
import { getTranslation, TranslationKeys } from "../../../util/translations"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"
import chevron_right from "../../../assets/svgs/chevron_right.svg"
interface CalendarViewProps {
    events: CIEvent[]
    onSelect: (value: Dayjs) => void
}

const CalendarView = ({ events, onSelect }: CalendarViewProps) => {
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
                    {Array.from({ length: Math.min(eventCount, 4) }).map(
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
        const oneMonthAgo = dayjs().startOf("month")
        if (newValue.isAfter(oneMonthAgo)) {
            setValue(newValue)
        }
    }

    const nextMonth = () => {
        const newValue = value.add(1, "month")
        const twoMonthsAhead = dayjs().add(2, "months").endOf("month")
        if (newValue.isBefore(twoMonthsAhead)) {
            setValue(newValue)
        }
    }

    return (
        <section className="calendar-view">
            <header className={`calendar-controller ${store.getDirection} `}>
                <Icon
                    onClick={nextMonth}
                    icon={chevron_right}
                    className={`${
                        store.getDirection === "ltr" ? "next" : "back"
                    } ${
                        value.isAfter(
                            dayjs().add(2, "months").startOf("month")
                        ) && "disabled"
                    }`}
                />
                {/* <label className="label">{value.format("MMMM YYYY")}</label> */}
                <label className="label">
                    {getTranslation(
                        value
                            .locale("en")
                            .format("MMMM")
                            .toLocaleLowerCase() as keyof TranslationKeys,
                        store.getLanguage
                    )}
                </label>
                <Icon
                    onClick={prevMonth}
                    icon={chevron_right}
                    className={`${
                        store.getDirection === "ltr" ? "back" : "next"
                    } ${value.month() === dayjs().month() && "disabled"}`}
                />
            </header>
            <section className="calendar-view__card card">
                <ConfigProvider
                    direction={store.getDirection}
                    locale={
                        store.getLanguage === "he"
                            ? hb
                            : store.getLanguage === "ru"
                            ? ru
                            : en
                    }
                >
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

export default observer(CalendarView)

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
