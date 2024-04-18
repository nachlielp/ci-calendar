import type { CalendarProps } from "antd";
import { Calendar, Card } from "antd";
import type { Dayjs } from "dayjs";
import { useWindowSize } from "../../hooks/useWindowSize";
import { IEvently } from "../../util/interfaces";
import dayjs from "dayjs";

interface CalendarViewProps {
  events: IEvently[];
  selectedDay: Dayjs;
  onSelect: (value: Dayjs) => void;
}

export default function CalendarView({
  events,
  selectedDay,
  onSelect,
}: CalendarViewProps) {
  const { width } = useWindowSize();
  const setWidth = width > 600 ? 500 : width * 0.9;

  const dateCellRender = (value: Dayjs) => {
    return (
      <div className="day-cell p-2 relative">
        {eventsOnDay(value, events) && (
          <span className="absolute bottom-1 right-1 mr-[3px] h-2 w-2 bg-blue-500 rounded-full"></span>
        )}
      </div>
    );
  };
  //Render each cell in the calendar
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  return (
    <div style={{ width: setWidth }} className="mx-auto">
      <Card className="mx-auto mt-5">
        <Calendar
          fullscreen={false}
          cellRender={cellRender}
          mode="month"
          onSelect={onSelect}
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
