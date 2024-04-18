import type { CalendarProps } from "antd";
import { Calendar, Card } from "antd";
import type { Dayjs } from "dayjs";
import { useWindowSize } from "../../hooks/useWindowSize";

const getListData = (value: Dayjs) => {
  let listData;
  switch (value.date()) {
    case 8:
      listData = [{ type: "warning" }];
      break;
    case 10:
      listData = [{ type: "warning" }];
      break;
    case 15:
      listData = [{ type: "warning" }];
      break;
    default:
  }
  return listData || [];
};

const getMonthData = (value: Dayjs) => {
  if (value.month() === 8) {
    return 1394;
  }
};

export default function CalendarView() {
  const { width } = useWindowSize();
  const setWidth = width > 600 ? 500 : width * 0.9;
  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const hasEvents = listData.length > 0;
    return (
      <div className="day-cell p-2 relative">
        {hasEvents && (
          <span className="absolute bottom-1 right-1 mr-[3px] h-2 w-2 bg-blue-500 rounded-full"></span>
          // Using Tailwind's negative margin utility `mr-[-2px]` to move the dot 2px to the left
        )}
      </div>
    );
  };
  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    if (info.type === "month") return monthCellRender(current);
    return info.originNode;
  };

  return (
    <div style={{ width: setWidth }} className="mx-auto">
      <Card className="mx-auto mt-5">
        <Calendar fullscreen={false} cellRender={cellRender} />
      </Card>
    </div>
  );
}
