import { useState } from "react";
import type { CalendarProps } from "antd";
import { Calendar, Card } from "antd";
import type { Dayjs } from "dayjs";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IEvently } from "../../../util/interfaces";
import dayjs from 'dayjs';
import 'dayjs/locale/he';
dayjs.locale('he');
import isBetween from 'dayjs/plugin/isBetween';
import { getMonthNameHebrew } from "../../../util/helpers";
dayjs.extend(isBetween)

interface CalendarViewProps {
  events: IEvently[];
  onSelect: (value: Dayjs) => void;
}

export default function CalendarView({ events, onSelect }: CalendarViewProps) {
  const { width } = useWindowSize();
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const setWidth = width > 6000 ? 500 : width * 0.9;

  const dateCellRender = (current: Dayjs) => {
    const eventCount = eventsOnDay(current, events).length;
    const isToday = current.isSame(dayjs(), 'day');
    const isDisabled = !eventsOnDay(current, events).length;
    const isSelected = selectedDay && current.isSame(selectedDay, 'day');

    return (
      <div className={`calendar-view__day-cell ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${eventCount > 0 ? 'has-events-' + eventCount : ''}`}>
        <span>{current.date()}</span>
        <div className="event-dots">
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, index) => (
            <span key={index} className="event-dot"></span>
          ))}
        </div>
      </div>
    );
  };

  const disabledDate = (current: Dayjs) => {
    const lastMonth = dayjs().subtract(1, "month").startOf("month");
    const threeMonthsAhead = dayjs().add(3, "months").endOf("month");
    const isOutOfRange =
      current.isBefore(lastMonth, "day") ||
      current.isAfter(threeMonthsAhead, "day");
    return isOutOfRange;
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (day, info) => {
    if (info.type === "date") return dateCellRender(day);
    return info.originNode;
  };

  const customHeaderRender = ({ value, onChange }: any) => {
    return (
      <div className="calendar-view__header-buttons">
        <div className="">
          <button
            className=""
            onClick={() => onChange(value.add(1, "month"))}
          >
            הבא
          </button>
        </div>
        <div className="">
          <span>{getMonthNameHebrew(value.month())} {value.year()}</span>
        </div>
        <div className="">
          <button
            className=""
            onClick={() => onChange(value.subtract(1, "month"))}
          >
            קודם
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <Card className="calendar-view__card">
        <Calendar
          disabledDate={disabledDate}
          fullscreen={false}
          fullCellRender={cellRender}
          mode="month"
          onSelect={onSelect}
          headerRender={customHeaderRender}
        />
      </Card>
    </div>
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