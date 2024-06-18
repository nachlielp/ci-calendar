import type { CalendarProps } from "antd";
import { Calendar, Card } from "antd";
import type { Dayjs } from "dayjs";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IEvently } from "../../../util/interfaces";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import { getMonthNameHebrew } from "../../../util/helpers";
dayjs.extend(isBetween)

interface CalendarViewProps {
  events: IEvently[];
  onSelect: (value: Dayjs) => void;
}

export default function CalendarView({ events, onSelect }: CalendarViewProps) {
  const { width } = useWindowSize();
  const setWidth = width > 600 ? 500 : width * 0.9;
  const dateCellRender = () => {
    return <div className="calendar-view__day-cell"></div>;
  };

  const disabledDate = (current: Dayjs) => {
    const lastMonth = dayjs().subtract(1, "month").startOf("month");
    const threeMonthsAhead = dayjs().add(3, "months").endOf("month");
    const isOutOfRange =
      current.isBefore(lastMonth, "day") ||
      current.isAfter(threeMonthsAhead, "day");
    const hasNoEvents = !eventsOnDay(current, events);
    return isOutOfRange || hasNoEvents;
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (_, info) => {
    if (info.type === "date") return dateCellRender();
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
    <div className="calendar-view" style={{ width: setWidth }}>
      <Card className="calendar-view__card">
        <Calendar
          disabledDate={disabledDate}
          fullscreen={false}
          cellRender={cellRender}
          mode="month"
          onSelect={onSelect}
          headerRender={customHeaderRender}
        />
      </Card>
    </div>
  );
}

function eventsOnDay(day: Dayjs, events: IEvently[]) {
  return events.some(event =>
    day.isBetween(
      dayjs(event.dates.startDate).startOf('day'),
      dayjs(event.dates.endDate).endOf('day'),
      null,
      '[]'
    )
  );
}