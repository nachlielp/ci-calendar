import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Card, Form } from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "../../../styles/overrides.css";
import { v4 as uuidv4 } from "uuid";

import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions } from "../../../util/options";
import {
  IAddress,
  IEventiPart,
  IEvently,
  UserType,
} from "../../../util/interfaces";
import { IGooglePlaceOption } from "../Other/GooglePlacesInput";
import { useState } from "react";
import MultiDayEventSubEventsForm from "./MultiDayEventSubEventsForm";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import MultiDayFormHead from "./MultiDayFormHead";
import { useTeachersList } from "../../../hooks/useTeachersList";
import { formatTeachers } from "./SingleDayEventForm";
import { Icon } from "../Other/Icon";

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

export default function MultiDayEventForm() {
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [schedule, setSchedule] = useState(false);
  const navigate = useNavigate();
  const { teachers } = useTeachersList();

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

  const handleScheduleChange = (checked: boolean) => {
    setSchedule(checked);
  };

  const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
    setDates(dates);
  };
  const handleSubmit = async (values: any) => {
    // console.log("MultiDayEventForm.handleSubmit.values: ", values);

    const subEventsTemplate: IEventiPart[] = [];

    values.days?.forEach((day: any) => {
      const startTime: string = dayjs(day["event-date-base"])
        .hour(dayjs(day["event-time-base"][0]).hour())
        .minute(dayjs(day["event-time-base"][0]).minute())
        .toISOString();
      const endTime: string = dayjs(day["event-date-base"])
        .hour(dayjs(day["event-time-base"][1]).hour())
        .minute(dayjs(day["event-time-base"][1]).minute())
        .toISOString();
      subEventsTemplate.push({
        startTime: startTime,
        endTime: endTime,
        type: day["event-type-base"],
        tags: day["event-tags-base"] || [],
        teachers: formatTeachers(day["event-teacher-base"], teachers),
      });

      // Additional sub-events for each day
      day["sub-events"]?.forEach((subEvent: any) => {
        const startTime: string = dayjs(day["event-date-base"])
          .hour(dayjs(subEvent.time[0]).hour())
          .minute(dayjs(subEvent.time[0]).minute())
          .toISOString();
        const endTime: string = dayjs(day["event-date-base"])
          .hour(dayjs(subEvent.time[1]).hour())
          .minute(dayjs(subEvent.time[1]).minute())
          .toISOString();
        subEventsTemplate.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teachers: formatTeachers(subEvent.teacher, teachers),
          startTime: startTime,
          endTime: endTime,
        });
      });
    });

    if (!address || !dates) {
      return;
    }

    try {
      const event: IEvently = {
        dates: {
          startDate: dates[0].toISOString(),
          endDate: dates[1].toISOString(),
        },
        type: values["main-event-type"],
        id: uuidv4(),
        address: address,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        owners: [{ value: currentUser.id, label: currentUser.fullName }],
        links: values["links"] || [],
        price: values["prices"] || [],
        hide: false,
        subEvents: subEventsTemplate,
        district: values["district"],
      };
      console.log("MultiDayEventForm.handleSubmit.event: ", event);
      await createEvent(event);

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
        <MultiDayFormHead
          handleAddressSelect={handleAddressSelect}
          handleDateChange={handleDateChange}
          handleScheduleChange={handleScheduleChange}
          schedule={schedule}
        />

        {schedule && (
          <Form.List name="days">
            {(days, { add, remove }) => (
              <>
                {days.map(({ key, name, ...restField }) => (
                  <div key={key}>
                    <MultiDayEventSubEventsForm
                      day={name}
                      {...restField}
                      remove={remove}
                      teachers={teachers}
                      form={form}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center mt-2">
                  <Button className="w-1/2" onClick={() => add()} block>
                    <Icon icon="addCircle" title="הוסף יום" />
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        )}
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
