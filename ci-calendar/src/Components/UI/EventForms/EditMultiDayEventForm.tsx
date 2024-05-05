import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Card, Form } from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { IEvently, IAddress } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import MultiDayFormHead from "./MultiDayFormHead";
import MultiDayEventSubEventsForm from "./MultiDayEventSubEventsForm";
import { CodeSandboxCircleFilled, PlusOutlined } from "@ant-design/icons";
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
    try {
      // Transform values here and prepare the event object
      const updatedEvent = { ...eventData, ...values }; // Simplified, adjust according to your needs
      await updateEvent(eventData.id, updatedEvent);
      navigate("/");
    } catch (error) {
      console.error("EditMultiDayEventForm.handleSubmit.error: ", error);
      throw error;
    }
  };
  console.log("currentFormValues", currentFormValues);
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
      "event-teacher-base": subEvent.teacher,
      "event-tags-base": subEvent.tags,
    });
  });

  // Convert the map to an array of days with their respective sub-events
  const days = Array.from(daysMap, ([_, subEvents]) => {
    const baseEvent = subEvents[0];
    const otherSubEvents = subEvents.slice(1).map((subEvent) => ({
      type: subEvent["event-type-base"],
      time: subEvent["event-time-base"],
      teacher: subEvent["event-teacher-base"],
      tags: subEvent["event-tags-base"],
    }));

    return {
      "event-date-base": baseEvent["event-date-base"],
      "event-type-base": baseEvent["event-type-base"],
      "event-time-base": baseEvent["event-time-base"],
      "event-teacher-base": baseEvent["event-teacher-base"],
      "event-tags-base": baseEvent["event-tags-base"],
      "sub-events": otherSubEvents,
    };
  });

  console.log("days", days);
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
// const eventToFormValues = (event: IEvently) => {
//   const daysMap = new Map<string, any[]>();
//   event.subEvents.forEach((subEvent) => {
//     const startDay = dayjs(subEvent.startTime).format("YYYY-MM-DD");
//     if (!daysMap.has(startDay)) {
//       daysMap.set(startDay, []);
//     }
//     daysMap.get(startDay)!.push({
//       "event-date-base": dayjs(subEvent.startTime),
//       "event-type-base": subEvent.type,
//       "event-time-base": [dayjs(subEvent.startTime), dayjs(subEvent.endTime)],
//       "event-teacher-base": subEvent.teacher,
//       "event-tags-base": subEvent.tags,
//     });
//   });

//   // Convert the map to an array of days with their respective sub-events
//   const days = Array.from(daysMap, ([day, subEvents]) => ({
//     day,
//     subEvents,
//   }));

//   console.log("days", days);
//   const currentFormValues = {
//     createdAt: event.createdAt,
//     updatedAt: dayjs().toISOString(),
//     "event-title": event.title,
//     "event-description": event.description,
//     district: event.district,
//     address: event.address,
//     "event-date": [dayjs(event.dates.startDate), dayjs(event.dates.endDate)],
//     "main-event-type": event.type,
//     "event-schedule": event.subEvents.length > 0,
//     links: event.links,
//     prices: event.price,
//     days: event.subEvents.map((subEvent) => ({
//       "event-date-base": dayjs(subEvent.startTime),
//       "event-type-base": subEvent.type,
//       "event-time-base": [dayjs(subEvent.startTime), dayjs(subEvent.endTime)],
//       "event-teacher-base": subEvent.teacher,
//       "event-tags-base": subEvent.tags,
//       "sub-events": event.subEvents
//         .filter((se) => se !== subEvent)
//         .map((se) => ({
//           type: se.type,
//           time: [dayjs(se.startTime), dayjs(se.endTime)],
//           teacher: se.teacher,
//           tags: se.tags,
//         })),
//     })),
//   };

//   return { currentFormValues, address: event.address };
// };
