import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Card, Form } from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { IEvently, IAddress, IEventiPart } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import MultiDayFormHead from "./MultiDayFormHead";
import MultiDayEventSubEventsForm from "./MultiDayEventSubEventsForm";
import { PlusOutlined } from "@ant-design/icons";
import { IGooglePlaceOption } from "../Other/GooglePlacesInput";

export default function EditMultiDayEventForm() {
  const navigate = useNavigate();
  const { getEvent, currentUser, updateEvent } = useAuthContext();
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }

  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<IEvently | null>(null);
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [schedule, setSchedule] = useState(false);
  const [currentFormValues, setCurrentFormValues] = useState<any>();
  const [address, setAddress] = useState<IAddress>();
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (eventId) {
          const res = await getEvent(eventId);
          setEventData(res);
          if (res) {
            const { currentFormValues, address } = eventToFormValues(res);
            setCurrentFormValues(currentFormValues);
            setDates([
              dayjs(currentFormValues["event-date"][0]),
              dayjs(currentFormValues["event-date"][1]),
            ]);
            setAddress(address);
            setSchedule(currentFormValues["event-schedule"]);
          }
        }
      } catch (error) {
        console.error(`EditMultiDayEventForm.fetchEvent.eventId: `, eventId);
        throw error;
      }
    };
    fetchEvent();
  }, [eventId, getEvent]);

  if (!eventData) return <Loading />;

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
        teachers: [day["event-teachers-base"]] || [],
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
          teachers: [subEvent.teachers] || [],
          startTime: startTime,
          endTime: endTime,
        });
      });
    });

    if (!address || !dates) {
      return;
    }

    const event: IEvently = {
      dates: {
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      },
      type: values["main-event-type"],
      id: eventData.id,
      address: address,
      createdAt: eventData.createdAt,
      updatedAt: dayjs().toISOString(),
      title: values["event-title"],
      description: values["event-description"] || "",
      owners: [currentUser.id],
      links: values["links"] || [],
      price: values["prices"] || [],
      hide: false,
      subEvents: subEventsTemplate,
      district: values["district"],
    };
    // console.log("MultiDayEventForm.handleSubmit.event: ", event);
    try {
      await updateEvent(eventData.id, event);

      navigate("/");
    } catch (error) {
      console.error("EventForm.handleSubmit.error: ", error);
      throw error;
    }
  };
  return (
    <Card className="max-w-[500px] mx-auto mt-4">
      <Form
        form={form}
        variant="filled"
        onFinish={handleSubmit}
        initialValues={currentFormValues}
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
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center mt-2">
                  <Button onClick={() => add()} block>
                    <PlusOutlined /> הוסף יום
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
            עדכן אירוע
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

const eventToFormValues = (event: IEvently) => {
  const daysMap = new Map<string, any[]>();
  event.subEvents.forEach((subEvent) => {
    const startDay = dayjs(subEvent.startTime).format("YYYY-MM-DD");
    if (!daysMap.has(startDay)) {
      daysMap.set(startDay, []);
    }
    daysMap.get(startDay)!.push({
      "event-date-base": dayjs(subEvent.startTime),
      "event-type-base": subEvent.type,
      "event-time-base": [dayjs(subEvent.startTime), dayjs(subEvent.endTime)],
      "event-teacher-base": subEvent.teachers,
      "event-tags-base": subEvent.tags,
    });
  });

  const days = Array.from(daysMap, ([_, subEvents]) => {
    const baseEvent = subEvents[0];
    const otherSubEvents = subEvents.slice(1).map((subEvent) => ({
      type: subEvent["event-type-base"],
      time: subEvent["event-time-base"],
      teachers: subEvent["event-teacher-base"],
      tags: subEvent["event-tags-base"],
    }));

    return {
      "event-date-base": baseEvent["event-date-base"],
      "event-type-base": baseEvent["event-type-base"],
      "event-time-base": baseEvent["event-time-base"],
      "event-teachers-base": baseEvent["event-teachers-base"],
      "event-tags-base": baseEvent["event-tags-base"],
      "sub-events": otherSubEvents,
    };
  });

  const currentFormValues = {
    createdAt: event.createdAt,
    updatedAt: dayjs().toISOString(),
    "event-title": event.title,
    "event-description": event.description,
    district: event.district,
    address: event.address,
    "event-date": [dayjs(event.dates.startDate), dayjs(event.dates.endDate)],
    "main-event-type": event.type,
    "event-schedule": event.subEvents.length > 0,
    links: event.links,
    prices: event.price,
    days: days,
  };
  return { currentFormValues, address: event.address };
};
