import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Card, Form } from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useState } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { IAddress, IEvently, UserType } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import { IGooglePlaceOption } from "../Other/GooglePlacesInput";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import SingleDayEventBaseForm from "./SingleDayEventBaseForm";
import SubEventsForm from "./SubEventsForm";
import { useTeachers } from "../../../hooks/useTeachers";
import { formatTeachers } from "./SingleDayEventForm";

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

export default function EditSingleDayEventForm() {
  const navigate = useNavigate();
  const { teachers } = useTeachers();
  const { getEvent, currentUser, updateEvent } = useAuthContext();
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<IEvently | null>(null);
  const [newAddress, setNewAddress] = useState<IAddress | null>(null);
  const [eventDate, setEventDate] = useState(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm();

  //TODO move to custom hook
  useEffect(() => {
    const fetchEvent = async () => {
      if (eventId) {
        const eventData = await getEvent(eventId);
        setEventData(eventData);
      }
    };
    fetchEvent();
  }, [eventId, getEvent]);

  if (!eventData) return <Loading />;

  const { currentFormValues, address } = eventToFormValues(eventData);

  const handleAddressSelect = (place: IGooglePlaceOption) => {
    const selectedAddress = {
      label: place.label,
      place_id: place.value.place_id,
    };
    setNewAddress(selectedAddress);
    form.setFieldValue("address", selectedAddress);
  };

  const handleDateChange = (date: dayjs.Dayjs) => {
    setEventDate(date);
  };

  const handleEndDateChange = (date: dayjs.Dayjs) => {
    setEndDate(date);
  };
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }

  if (
    currentUser.userType !== UserType.admin &&
    currentUser.userType !== UserType.teacher
  ) {
    navigate("/");
  }

  const handleSubmit = async (values: any) => {
    console.log("EventForm.handleSubmit.values: ", values);

    const subEvents = [
      {
        startTime: dayjs(
          values["event-date"]
            .hour(values["event-time"][0].hour())
            .minute(values["event-time"][0].minute())
        ).toISOString(),
        endTime: dayjs(
          values["event-date"]
            .hour(values["event-time"][1].hour())
            .minute(values["event-time"][1].minute())
        ).toISOString(),
        type: values["event-types"] || "",
        tags: values["event-tags"] || [],
        teachers: formatTeachers(values["teachers"], teachers),
      },
    ];
    if (values["sub-events"]) {
      values["sub-events"].forEach((subEvent: any) =>
        subEvents.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teachers: formatTeachers(subEvent.teachers, teachers),
          startTime: dayjs(
            subEvent.time[0]
              .hour(subEvent.time[0].hour())
              .minute(subEvent.time[0].minute())
              .toISOString()
          ).toISOString(),
          endTime: dayjs(
            subEvent.time[1]
              .hour(subEvent.time[1].hour())
              .minute(subEvent.time[1].minute())
          ).toISOString(),
        })
      );
    }

    const event: IEvently = {
      dates: {
        startDate: dayjs(values["event-date"][0]).toISOString(),
        endDate: dayjs(values["event-date"][1]).toISOString(),
      },
      type: "",
      id: eventData.id,
      address: newAddress || address,
      createdAt: eventData.createdAt,
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
    try {
      console.log("EventForm.handleSubmit.event: ", event);
      await updateEvent(event.id, event);
      navigate("/");
    } catch (error) {
      console.error("EventForm.handleSubmit.error: ", error);
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
        initialValues={currentFormValues}
      >
        <SingleDayEventBaseForm
          form={form}
          handleAddressSelect={handleAddressSelect}
          handleDateChange={handleDateChange}
          handleEndDateChange={handleEndDateChange}
          eventDate={eventDate}
          endDate={endDate}
          idEdit={true}
          teachers={teachers}
        />
        <SubEventsForm day="" form={form} teachers={teachers} />
        <AddLinksForm />
        <AddPricesForm />

        <Form.Item
          wrapperCol={{ span: 24 }}
          className="mt-4 flex justify-center"
        >
          <Button type="primary" htmlType="submit">
            עדכן אירוע
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

function eventToFormValues(event: IEvently) {
  const currentFormValues = {
    "event-title": event.title,
    "event-description": event.description,
    address: event.address,
    district: event.district,
    "event-types": event.subEvents[0]?.type,
    "event-tags": event.subEvents[0]?.tags,
    "teachers": reverseFormatTeachers(event.subEvents[0]?.teachers),
    "event-date": dayjs.tz(
      dayjs(event.subEvents[0]?.startTime),
      "Asia/Jerusalem"
    ),
    "event-time": [
      dayjs(event.subEvents[0]?.startTime).tz("Asia/Jerusalem"),
      dayjs(event.subEvents[0]?.endTime).tz("Asia/Jerusalem"),
    ],
    "sub-events": event.subEvents.slice(1).map((subEvent) => ({
      type: subEvent.type,
      tags: subEvent.tags,
      teachers: reverseFormatTeachers(subEvent.teachers),
      time: [
        dayjs(subEvent.startTime).tz("Asia/Jerusalem"),
        dayjs(subEvent.endTime).tz("Asia/Jerusalem"),
      ],
    })),
    links: event.links.map((link) => ({
      title: link.title,
      link: link.link,
    })),
    prices: event.price.map((price) => ({
      title: price.title,
      sum: price.sum,
    })),
  };
  // console.log("currentFormValues: ", currentFormValues);
  return { currentFormValues, address: event.address };
}

export function reverseFormatTeachers(teachers: { label: string, value: string }[]) {
  return teachers.map(teacher => teacher.value !== "NON_EXISTENT" ? teacher.value : teacher.label);
}

