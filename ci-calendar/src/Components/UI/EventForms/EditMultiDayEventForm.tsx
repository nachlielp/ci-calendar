import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button, Card, Form } from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CIEvent, IAddress, IEventiPart } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import MultiDayFormHead from "./MultiDayFormHead";
import MultiDayEventSubEventsForm from "./MultiDayEventSubEventsForm";
import { IGooglePlaceOption } from "../Other/GooglePlacesInput";
import { useTeachersList } from "../../../hooks/useTeachersList";
import { formatTeachers } from "./SingleDayEventForm";
import { reverseFormatTeachers } from "./EditSingleDayEventForm";
import { EventAction } from "../../../App";
import { v4 as uuidv4 } from "uuid";
import { Icon } from "../Other/Icon";
import { useUser } from "../../../context/UserContext";

export default function EditMultiDayEventForm({
  editType,
}: {
  editType: EventAction;
}) {
  const { teachers } = useTeachersList();
  const navigate = useNavigate();
  const { getEvent, updateEvent, createEvent } = useAuthContext();
  const { user } = useUser();
  if (!user) {
    throw new Error("user is null, make sure you're within a Provider");
  }

  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<CIEvent | null>(null);
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [schedule, setSchedule] = useState(false);
  const [currentFormValues, setCurrentFormValues] = useState<any>();
  const [address, setAddress] = useState<IAddress | undefined>();
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
  // const handleScheduleChange = (checked: boolean) => {
  //   setSchedule(checked);
  // };

  const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
    setDates(dates);
  };

  const submitedEventId =
    editType === EventAction.recycle ? uuidv4() : eventData.id;

  const handleSubmit = async (values: any) => {
    const subEventsTemplate: IEventiPart[] = [];

    values.days?.forEach((day: any) => {
      const baseDate = dayjs(day["event-date-base"]); // Clone the base date for each day

      const startTime: string = baseDate
        .clone()
        .hour(dayjs(day["event-time-base"][0]).hour())
        .minute(dayjs(day["event-time-base"][0]).minute())
        .toISOString();
      const endTime: string = baseDate
        .clone()
        .hour(dayjs(day["event-time-base"][1]).hour())
        .minute(dayjs(day["event-time-base"][1]).minute())
        .toISOString();
      subEventsTemplate.push({
        startTime: startTime,
        endTime: endTime,
        type: day["event-type-base"],
        tags: day["event-tags-base"] || [],
        teachers: formatTeachers(day["event-teachers-base"], teachers),
      });

      // Additional sub-events for each day
      day["sub-events"]?.forEach((subEvent: any) => {
        const subEventStartTime: string = baseDate
          .clone()
          .hour(dayjs(subEvent.time[0]).hour())
          .minute(dayjs(subEvent.time[0]).minute())
          .toISOString();
        const subEventEndTime: string = baseDate
          .clone()
          .hour(dayjs(subEvent.time[1]).hour())
          .minute(dayjs(subEvent.time[1]).minute())
          .toISOString();
        subEventsTemplate.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teachers: formatTeachers(subEvent.teachers, teachers),
          startTime: subEventStartTime,
          endTime: subEventEndTime,
        });
      });
    });

    if (!address || !dates) {
      return;
    }

    const event: CIEvent = {
      dates: {
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      },
      type: values["main-event-type"],
      id: submitedEventId,
      address: address,
      createdAt: eventData.createdAt,
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
    try {
      if (editType === EventAction.recycle) {
        await createEvent(event);
        navigate("/manage-events");
      } else {
        await updateEvent(eventData.id, event);
        navigate("/manage-events");
      }
    } catch (error) {
      console.error("EventForm.handleSubmit.error: ", error);
      throw error;
    }
  };

  const submitText =
    editType === EventAction.recycle ? "שיכפול אירוע" : "עדכון אירוע";

  return (
    <>
      <Card className="event-card">
        <Form
          form={form}
          variant="filled"
          onFinish={handleSubmit}
          initialValues={currentFormValues}
        >
          <MultiDayFormHead
            handleAddressSelect={handleAddressSelect}
            handleDateChange={handleDateChange}
            // handleScheduleChange={handleScheduleChange}
            // schedule={schedule}
            address={address}
          />
          {schedule && dates && (
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
                        limits={{
                          start: dates[0],
                          end: dates[1],
                        }}
                      />
                    </div>
                  ))}
                  <div className="add-button-container">
                    <Button className="add-button" onClick={() => add()} block>
                      <span className="add-button-content">
                        <Icon
                          icon="addCircle"
                          className="add-icon"
                          title="הוסף יום"
                        />
                      </span>
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
            className="submit-button-container"
          >
            <Button type="primary" htmlType="submit">
              {submitText}
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <div className="footer-space"></div>
    </>
  );
}

const eventToFormValues = (event: CIEvent) => {
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
      "event-teachers-base": reverseFormatTeachers(subEvent.teachers),
      "event-tags-base": subEvent.tags,
    });
  });

  const days = Array.from(daysMap, ([_, subEvents]) => {
    const baseEvent = subEvents[0];
    const otherSubEvents = subEvents.slice(1).map((subEvent) => ({
      type: subEvent["event-type-base"],
      time: subEvent["event-time-base"],
      teachers: reverseFormatTeachers(subEvent["event-teachers-base"]),
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
