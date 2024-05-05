import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Select,
  TimePicker,
  Tooltip,
} from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import VirtualList from "rc-virtual-list";

import { v4 as uuidv4 } from "uuid";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions, eventTypes, districtOptions } from "../../../util/options";
import { IAddress, IEvently, UserType } from "../../../util/interfaces";
import GooglePlacesInput, {
  IGooglePlaceOption,
} from "../Other/GooglePlacesInput";
import { useState } from "react";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import SubEventsForm from "./SubEventsForm";
import SingleDayEventBaseForm from "./SingleDayEventBaseForm";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault("Asia/Jerusalem");

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

const initialValues = {
  "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
  "event-tags": [tagOptions[0].value],
};

export default function SingleDayEventForm() {
  const [repeatOption, setRepeatOption] = useState<Frequency>(Frequency.none);
  const [eventDate, setEventDate] = useState(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const navigate = useNavigate();
  const { currentUser, createEvent } = useAuthContext();
  const [address, setAddress] = useState<IAddress>();
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }

  if (
    currentUser.userType !== UserType.admin &&
    currentUser.userType !== UserType.teacher
  ) {
    navigate("/");
  }
  const [form] = Form.useForm();

  const handleAddressSelect = (place: IGooglePlaceOption) => {
    const selectedAddress = {
      label: place.label,
      place_id: place.value.place_id,
    };
    setAddress(selectedAddress);
    form.setFieldValue("address", selectedAddress);
  };

  const handleRepeatChange = () => {
    setRepeatOption(form.getFieldValue("event-repeat"));
  };

  const handleDateChange = (date: dayjs.Dayjs) => {
    setEventDate(date);
  };

  const handleEndDateChange = (date: dayjs.Dayjs) => {
    setEndDate(date);
  };

  const handleSubmit = async (values: any) => {
    // console.log(values);

    const subEventsTemplate = [
      {
        startTime: dayjs(
          values["event-date"]
            .hour(values["event-time"][0].hour())
            .minute(values["event-time"][0].minute())
            .toISOString()
        ),
        endTime: dayjs(
          values["event-date"]
            .hour(values["event-time"][1].hour())
            .minute(values["event-time"][1].minute())
            .toISOString()
        ),
        type: values["event-types"],
        tags: values["event-tags"] || [],
        teacher: values["event-teacher"] || "",
      },
    ];

    if (values["sub-events"]) {
      values["sub-events"].forEach((subEvent: any) =>
        subEventsTemplate.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teacher: subEvent.teacher || "",
          startTime: dayjs(
            values["event-date"]
              .hour(subEvent.time[0].hour())
              .minute(subEvent.time[0].minute())
              .toISOString()
          ),
          endTime: dayjs(
            values["event-date"]
              .hour(subEvent.time[1].hour())
              .minute(subEvent.time[1].minute())
              .toISOString()
          ),
        })
      );
    }

    if (!address) {
      return;
    }

    try {
      if (repeatOption === Frequency.none) {
        const event: IEvently = {
          id: uuidv4(),
          dates: {
            startDate: eventDate.toISOString(),
            endDate: eventDate.toISOString(),
          },
          type: "",
          address: address,
          createdAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
          title: values["event-title"],
          description: values["event-description"] || "",
          owners: [currentUser.id],
          links: values["links"] || [],
          price: values["prices"] || [],
          hide: false,
          subEvents: subEventsTemplate.map((subEvent) => ({
            ...subEvent,
            startTime: subEvent.startTime.toISOString(),
            endTime: subEvent.endTime.toISOString(),
          })),
          district: values["district"],
        };
        // console.log("EventForm.handleSubmit.event: ", event);
        await createEvent(event);
      } else if (endDate) {
        const dates = listOfDates(
          eventDate,
          endDate,
          repeatOption,
          form.getFieldValue("event-repeat-week-interval")
        );

        for (const date of dates) {
          const subEvents = subEventsTemplate.map((subEvent) => ({
            ...subEvent,
            startTime: date
              .hour(subEvent.startTime.hour())
              .minute(subEvent.startTime.minute())
              .toISOString(),
            endTime: date
              .hour(subEvent.endTime.hour())
              .minute(subEvent.endTime.minute())
              .toISOString(),
          }));

          const event: IEvently = {
            type: "",
            dates: {
              startDate: date.toISOString(),
              endDate: date.toISOString(),
            },
            id: uuidv4(),
            address: address,
            createdAt: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
            title: values["event-title"],
            description: values["event-description"] || "",
            owners: [currentUser.id],
            links: values["links"] || [],
            price: values["prices"] || [],
            hide: false,
            subEvents: subEvents,
            district: values["district"],
          };
          await createEvent(event);
        }
      }
      navigate("/");
    } catch (error) {
      console.error("EventForm.handleSubmit.error: ", error);
      throw error;
    }
  };

  return (
    <Card className="max-w-[500px] mx-auto  mt-4 ">
      <Form
        {...formItemLayout}
        form={form}
        onFinish={handleSubmit}
        variant="filled"
        labelCol={{ span: 6, offset: 0 }}
        wrapperCol={{ span: 16, offset: 0 }}
        initialValues={initialValues}
      >
        <SingleDayEventBaseForm
          form={form}
          handleAddressSelect={handleAddressSelect}
          handleDateChange={handleDateChange}
          handleEndDateChange={handleEndDateChange}
          handleRepeatChange={handleRepeatChange}
          repeatOption={repeatOption}
          eventDate={eventDate}
          endDate={endDate}
        />
        <SubEventsForm day="" />
        <AddLinksForm />
        <AddPricesForm />

        <Form.Item
          wrapperCol={{ span: 24 }}
          className="mt-4 flex justify-center"
        >
          <Button type="primary" htmlType="submit">
            צור אירוע
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export enum Frequency {
  none = "none",
  weekly = "weekly",
  byWeek = "by-week",
  monthly = "monthly",
}

export const repeatOptions = [
  { value: Frequency.none, label: "אף פעם" },
  { value: Frequency.weekly, label: "כל  שבוע" },
  { value: Frequency.byWeek, label: "כל כמה שבועות" },
  { value: Frequency.monthly, label: "כל חודש" },
];

export const repeatTooltip = (
  <>
    <p>* כל כמה שבועות - לדוגמה, כל שבועים ביום שלישי </p>
    <br />
    <p>* כל חודש - לדוגמה, השבת השניה של כל חודש</p>
  </>
);

export function getDayAndWeekOfMonth(date: dayjs.Dayjs) {
  const dayOfWeek = date.day(); // 0 (Sunday) to 6 (Saturday)
  const dayOfMonth = date.date();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  return { dayOfWeek, weekOfMonth };
}

export function listOfDates(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  repeatOption: Frequency,
  repeatInterval?: number
) {
  const dates = [];
  let date = startDate;
  if (repeatOption === Frequency.weekly) {
    while (!date.isAfter(endDate.add(1, "day"))) {
      dates.push(date);
      date = date.add(1, "week");
    }
  } else if (repeatOption === Frequency.byWeek && repeatInterval) {
    while (!date.isAfter(endDate.add(1, "day"))) {
      dates.push(date);
      date = date.add(repeatInterval, "week");
    }
  } else if (repeatOption === Frequency.monthly) {
    const { dayOfWeek, weekOfMonth } = getDayAndWeekOfMonth(startDate);
    while (!date.isAfter(endDate)) {
      dates.push(date);
      date = date.add(1, "month");
      date = moveToSameWeekAndDay(date, dayOfWeek, weekOfMonth);
    }
  }
  return dates;
}

export function moveToSameWeekAndDay(
  date: dayjs.Dayjs,
  dayOfWeek: number,
  weekOfMonth: number
): dayjs.Dayjs {
  const monthStart = date.startOf("month");
  let adjustedDate = monthStart.add((weekOfMonth - 1) * 7, "day");
  while (adjustedDate.day() !== dayOfWeek) {
    adjustedDate = adjustedDate.add(1, "day");
  }
  if (adjustedDate.month() !== monthStart.month()) {
    adjustedDate = adjustedDate.subtract(1, "week");
  }
  return adjustedDate;
}

export const formatMonthlyDate = (date: dayjs.Dayjs) => {
  const { dayOfWeek, weekOfMonth } = getDayAndWeekOfMonth(date);
  let day;
  switch (dayOfWeek) {
    case 0:
      day = "ראשון";
      break;
    case 1:
      day = "שני";
      break;
    case 2:
      day = "שלישי";
      break;
    case 3:
      day = "רביעי";
      break;
    case 4:
      day = "חמישי";
      break;
    case 5:
      day = "שישי";
      break;
    case 6:
      day = "שבת";
      break;
  }

  let frequency;
  switch (weekOfMonth) {
    case 1:
      frequency = "ראשונה";
      break;
    case 2:
      frequency = "שניה";
      break;
    case 3:
      frequency = "שלישית";
      break;
    case 4:
      frequency = "רביעית";
      break;
    default:
      frequency = "חמישית";
      break;
  }
  return `יום ${day} ה${frequency} בחודש`;
};
