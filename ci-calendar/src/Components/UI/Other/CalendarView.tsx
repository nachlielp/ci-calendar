import type { CalendarProps } from "antd";
import { Calendar, Card, ConfigProvider } from "antd";
import type { Dayjs } from "dayjs";
import { IEvently } from "../../../util/interfaces";
import isBetween from 'dayjs/plugin/isBetween';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
dayjs.extend(isBetween)
dayjs.locale('he');
import hb from 'antd/locale/he_IL';
import { useState } from "react";
import { Icon } from "./Icon";

interface CalendarViewProps {
  events: IEvently[];
  onSelect: (value: Dayjs) => void;
}

export default function CalendarView({ events, onSelect }: CalendarViewProps) {
  const [value, setValue] = useState<Dayjs>(dayjs());

  const onChange = (newValue: Dayjs) => {
    setValue(newValue);
  };

  const dateCellRender = (current: Dayjs) => {
    const eventCount = eventsOnDay(current, events).length;
    const isToday = current.isSame(dayjs(), 'day');
    const isDisabled = !eventsOnDay(current, events).length;

    return (
      <div className={`calendar-view__day-cell ${isToday && 'today'} ${isDisabled && 'disabled'} ${eventCount > 0 && 'has-events-' + eventCount}`}>
        <span>{current.date()}</span>
        <div className="event-dots">
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, index) => (
            <span key={index} className="event-dot"></span>
          ))}
        </div>
      </div>
    );
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (day, info) => {
    if (info.type === "date") return dateCellRender(day);
    return info.originNode;
  };

  const prevMonth = () => {
    const newValue = value.subtract(1, 'month');
    const oneMonthAgo = dayjs().subtract(1, 'month').startOf('month');
    if (newValue.isAfter(oneMonthAgo)) {
      setValue(newValue);
    }
  };

  const nextMonth = () => {
    const newValue = value.add(1, 'month');
    const threeMonthsAhead = dayjs().add(3, 'months').endOf('month');
    if (newValue.isBefore(threeMonthsAhead)) {
      setValue(newValue);
    }
  };

  return (
    <section className="calendar-view">
      <header className="calendar-controller">
        <Icon onClick={prevMonth} icon="chevron_right" className="back" />
        <label className="label">{value.format('MMMM YYYY')}</label>
        <Icon onClick={nextMonth} icon="chevron_right" className="next" />
      </header>
      <Card className="calendar-view__card">
        <ConfigProvider locale={hb}>
          <Calendar
            value={value}
            mode='month'
            onChange={onChange}
            fullscreen={false}
            fullCellRender={cellRender}
            onSelect={onSelect}
            headerRender={() => <div></div>}
          />
        </ConfigProvider>
      </Card>
    </section>
  );
}

function eventsOnDay(day: Dayjs, events: IEvently[]) {
  return events.filter(event =>
    day.isBetween(
      dayjs(event.dates.startDate).startOf('day'),
      dayjs(event.dates.endDate).endOf('day'),
      null,
      '[]'
    )
  );
}