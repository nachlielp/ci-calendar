import type { CalendarProps } from "antd";
import { Calendar, Card } from "antd";
import type { Dayjs } from "dayjs";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IEvently } from "../../../util/interfaces";
import dayjs from "dayjs";

interface CalendarViewProps {
  events: IEvently[];
  selectedDay: Dayjs;
  onSelect: (value: Dayjs) => void;
}

export default function CalendarView({ events, onSelect }: CalendarViewProps) {
  const { width } = useWindowSize();
  const setWidth = width > 600 ? 500 : width * 0.9;
  const dateCellRender = () => {
    return <div className="day-cell p-2 relative"></div>;
  };
  // const dateCellRender

  const disabledDate = (current: Dayjs) => {
    const lastMonth = dayjs().subtract(1, "month").startOf("month");
    const threeMonthsAhead = dayjs().add(3, "months").endOf("month");
    const isOutOfRange =
      current.isBefore(lastMonth, "day") ||
      current.isAfter(threeMonthsAhead, "day");
    const hasNoEvents = !eventsOnDay(current, events);
    return isOutOfRange || hasNoEvents;
  };
  //Render each cell in the calendar
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (_, info) => {
    if (info.type === "date") return dateCellRender();
    return info.originNode;
  };
  const customHeaderRender = ({ value, onChange }: any) => {
    return (
      <div className="flex justify-between px-2 py-1">
        <button
          className="ant-btn ant-btn-default"
          onClick={() => onChange(value.add(1, "month"))}
        >
          הבא
        </button>
        <div>
          <span>{value.format("MMMM YYYY")}</span>
        </div>
        <button
          className="ant-btn ant-btn-default"
          onClick={() => onChange(value.subtract(1, "month"))}
        >
          קודם
        </button>
      </div>
    );
  };
  return (
    <div style={{ width: setWidth }} className="mx-auto">
      <Card className="mx-auto mt-5">
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
  return (
    events.filter((event) =>
      dayjs(event.subEvents[0].startTime).isSame(day, "day")
    ).length > 0
  );
}
