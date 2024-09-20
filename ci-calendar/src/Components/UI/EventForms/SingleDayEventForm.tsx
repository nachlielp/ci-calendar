import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Form } from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions } from "../../../util/options";
import { IAddress, IEvently, UserType } from "../../../util/interfaces";
import { IGooglePlaceOption } from "../Other/GooglePlacesInput";
import { useState } from "react";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import SubEventsForm from "./SubEventsForm";
import SingleDayEventBaseForm from "./SingleDayEventBaseForm";
import { useTeachersList } from "../../../hooks/useTeachersList";
import { useUser } from "../../../context/UserContext";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault("Asia/Jerusalem");

// const formItemLayout = {
//   labelCol: {
//     xs: { span: 24 },
//     sm: { span: 6 },
//   },
//   wrapperCol: {
//     xs: { span: 24 },
//     sm: { span: 14 },
//   },
// };

const initialValues = {
  "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
  "event-tags": [tagOptions[0].value],
};

export default function SingleDayEventForm() {
  const [form] = Form.useForm();
  const { teachers } = useTeachersList();

  const [repeatOption, setRepeatOption] = useState<EventFrequency>(
    EventFrequency.none
  );
  const [eventDate, setEventDate] = useState(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const navigate = useNavigate();
  const { createEvent } = useAuthContext();
  const { user } = useUser();
  const [address, setAddress] = useState<IAddress>();

  if (!user) {
    throw new Error("user is null, make sure you're within a Provider");
  }

  if (user.userType !== UserType.admin && user.userType !== UserType.teacher) {
    navigate("/");
  }

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
    const baseDate = dayjs(values["event-date"]); // Clone the base date for consistent date manipulation

    const subEventsTemplate = [
      {
        startTime: baseDate
          .clone()
          .hour(values["event-time"][0].hour())
          .minute(values["event-time"][0].minute())
          .toISOString(),
        endTime: baseDate
          .clone()
          .hour(values["event-time"][1].hour())
          .minute(values["event-time"][1].minute())
          .toISOString(),
        type: values["event-types"],
        tags: values["event-tags"] || [],
        teachers: formatTeachers(values["teachers"], teachers),
      },
    ];

    if (values["sub-events"]) {
      values["sub-events"].forEach((subEvent: any) => {
        subEventsTemplate.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teachers: formatTeachers(subEvent.teachers, teachers),
          startTime: baseDate
            .clone()
            .hour(subEvent.time[0].hour())
            .minute(subEvent.time[0].minute())
            .toISOString(),
          endTime: baseDate
            .clone()
            .hour(subEvent.time[1].hour())
            .minute(subEvent.time[1].minute())
            .toISOString(),
        });
      });
    }

    if (!address) {
      return;
    }

    try {
      if (repeatOption === EventFrequency.none) {
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
          owners: [{ value: user.id, label: user.fullName }],
          links: values["links"] || [],
          price: values["prices"] || [],
          hide: false,
          subEvents: subEventsTemplate,
          district: values["district"],
          creatorId: user.id,
          creatorName: user.fullName,
        };
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
              .clone()
              .hour(dayjs(subEvent.startTime).hour())
              .minute(dayjs(subEvent.startTime).minute())
              .toISOString(),
            endTime: date
              .clone()
              .hour(dayjs(subEvent.endTime).hour())
              .minute(dayjs(subEvent.endTime).minute())
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
            owners: [{ value: user.id, label: user.fullName }],
            links: values["links"] || [],
            price: values["prices"] || [],
            hide: false,
            subEvents: subEvents,
            district: values["district"],
            creatorId: user.id,
            creatorName: user.fullName,
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
    <div className="single-day-event-form">
      <section className="event-card">
        <Form
          // {...formItemLayout}
          form={form}
          onFinish={handleSubmit}
          variant="filled"
          // labelCol={{ span: 6, offset: 0 }}
          // wrapperCol={{ span: 16, offset: 0 }}
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
            idEdit={false}
            teachers={teachers}
          />
          <SubEventsForm form={form} day="" teachers={teachers} />
          <hr className="divider" />
          <label>
            <b>קישור</b> (יופיע ככפתור בעמוד האירוע)
          </label>
          <AddLinksForm />
          <hr className="divider" />
          <label>
            <b>מחיר</b>
          </label>
          <AddPricesForm />

          <Form.Item className="submit-button-container">
            <Button type="primary" htmlType="submit">
              יצירת אירוע
            </Button>
          </Form.Item>
        </Form>
      </section>
      <div className="footer-space"></div>
    </div>
  );
}

export const formatTeachers = (
  selectedTeachers: string[],
  teachers: { label: string; value: string }[]
) => {
  if (!selectedTeachers) return [];
  return selectedTeachers.map((teacher) => {
    const teacherObj = teachers.find((t) => t.value === teacher);
    if (teacherObj) {
      return teacherObj;
    } else {
      return { label: teacher, value: "NON_EXISTENT" };
    }
  });
};

export enum EventFrequency {
  none = "none",
  weekly = "weekly",
  byWeek = "by-week",
  monthly = "monthly",
}

export const repeatOptions = [
  { value: EventFrequency.none, label: "אף פעם" },
  { value: EventFrequency.weekly, label: "כל  שבוע" },
  { value: EventFrequency.byWeek, label: "כל כמה שבועות" },
  { value: EventFrequency.monthly, label: "כל חודש" },
];

export const repeatEventTooltip = (
  <>
    <p>* כל כמה שבועות - לדוגמה, כל שבועים ביום שלישי </p>
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
  repeatOption: EventFrequency,
  repeatInterval?: number
) {
  const dates = [];
  let date = startDate;
  if (repeatOption === EventFrequency.weekly) {
    while (!date.isAfter(endDate.add(1, "day"))) {
      dates.push(date);
      date = date.add(1, "week");
    }
  } else if (repeatOption === EventFrequency.byWeek && repeatInterval) {
    while (!date.isAfter(endDate.add(1, "day"))) {
      dates.push(date);
      date = date.add(repeatInterval, "week");
    }
  } else if (repeatOption === EventFrequency.monthly) {
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
