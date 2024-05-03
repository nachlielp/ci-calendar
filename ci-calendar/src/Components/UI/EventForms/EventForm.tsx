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

export default function EventForm() {
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
    const subEventsTemplate = [
      {
        startTime: dayjs(values["event-time"][0]),
        endTime: dayjs(values["event-time"][1]),
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
          startTime: dayjs(subEvent.time[0]),
          endTime: dayjs(subEvent.time[1]),
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
        <Card className="mt-4 border-4">
          <Form.Item
            label="כותרת"
            name="event-title"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Input />
          </Form.Item>
          <Row>
            <Col lg={24} md={24} xs={24}></Col>
          </Row>
          <Form.Item label="תיאור האירוע" name="event-description">
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item
            className="mt-4"
            label="אזור"
            name="district"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select options={districtOptions} />
          </Form.Item>

          <Form.Item
            className="mt-4"
            label="כתובת"
            name="address"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <GooglePlacesInput
              onPlaceSelect={(place: IGooglePlaceOption) => {
                handleAddressSelect(place);
              }}
            />
          </Form.Item>

          <Form.Item
            label="תאריך"
            name="event-date"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <DatePicker
              format={"DD/MM"}
              minDate={dayjs()}
              maxDate={dayjs().add(1, "year")}
              onChange={handleDateChange}
            />
          </Form.Item>

          <Form.Item
            className="mt-4"
            label={
              <Tooltip title={repeatTooltip}>
                חזרה &nbsp;
                <InfoCircleOutlined />
              </Tooltip>
            }
            name="event-repeat"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select
              options={repeatOptions}
              defaultValue={Frequency.none}
              onChange={handleRepeatChange}
            />
          </Form.Item>

          {repeatOption === Frequency.byWeek && (
            <Form.Item
              label="שבועות"
              name="event-repeat-week-interval"
              className="mt-4"
              rules={[{ required: true, message: "שדה חובה" }]}
            >
              <InputNumber min={1} precision={0} />
            </Form.Item>
          )}
          {repeatOption === Frequency.monthly && (
            <Form.Item
              label="תדירות"
              name="event-repeat-week-frequency"
              className="mt-4"
            >
              <Input placeholder={formatMonthlyDate(eventDate)} disabled />
            </Form.Item>
          )}
          {repeatOption !== "none" && (
            <>
              <Form.Item
                label="סיום חזרה"
                name="event-repeat-end-date"
                className="mt-4"
                rules={[{ required: true, message: "שדה חובה" }]}
              >
                <DatePicker
                  format={"DD/MM"}
                  minDate={eventDate}
                  maxDate={dayjs().add(1, "year")}
                  onChange={handleEndDateChange}
                />
              </Form.Item>
              <Form.Item
                label="תאריכים"
                name="event-list-of-dates"
                className="mt-4"
              >
                {endDate && (
                  <List>
                    <VirtualList
                      data={listOfDates(
                        eventDate,
                        endDate,
                        repeatOption,
                        form.getFieldValue("event-repeat-week-interval")
                      )}
                      height={200}
                      itemHeight={47}
                      itemKey="email"
                    >
                      {(date: dayjs.Dayjs, index: number) => (
                        <List.Item key={index} className="mr-4">
                          <List.Item.Meta
                            key={index}
                            title={date.format("DD/MM")}
                          />
                        </List.Item>
                      )}
                    </VirtualList>
                  </List>
                )}
              </Form.Item>
            </>
          )}
        </Card>

        <Card className="mt-4 border-2">
          <Row gutter={10} align="middle">
            <Col md={24} xs={24}>
              <Form.Item
                className="w-full"
                label="סוג האירוע"
                name="event-types"
                rules={[{ required: true, message: "שדה חובה" }]}
              >
                <Select options={eventTypes} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={10} align="middle">
            <Col md={24} xs={24}>
              <Form.Item
                label="שעות פעילות"
                name="event-time"
                rules={[{ required: true, message: "שדה חובה" }]}
                className="w-full"
              >
                <TimePicker.RangePicker
                  format="HH:mm"
                  minuteStep={5}
                  changeOnScroll
                  needConfirm={false}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={10} align="middle">
            <Col md={24} xs={24}>
              <Form.Item label="מורה" name="event-teacher" className="w-full">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={10} align="middle">
            <Col md={24} xs={24}>
              <Form.Item label="תגיות" name="event-tags" className="w-full">
                <Select options={tagOptions} mode="multiple" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Form.List name="sub-events">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card className="mt-4 border-2" key={key}>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        className="w-full"
                        {...restField}
                        label="סוג האירוע"
                        name={[name, "type"]}
                        rules={[{ required: true, message: "שדה חובה" }]}
                      >
                        <Select options={eventTypes} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        label="שעות פעילות"
                        name={[name, "time"]}
                        rules={[{ required: true, message: "שדה חובה" }]}
                        className="w-full"
                      >
                        <TimePicker.RangePicker
                          minuteStep={5}
                          format="HH:mm"
                          changeOnScroll
                          needConfirm={false}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        label="מורה"
                        name={[name, "teacher"]}
                        className="w-full"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        label="תגיות"
                        name={[name, "tags"]}
                        className="w-full"
                      >
                        <Select options={tagOptions} mode="multiple" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex items-center justify-center">
                    <Button onClick={() => remove(name)}>
                      <span className="text-red-500">
                        <MinusCircleOutlined /> הסר תת ארוע
                      </span>
                    </Button>
                  </div>
                </Card>
              ))}
              <div className="flex items-center justify-center mt-2">
                <Button className="w-1/2" onClick={() => add()} block>
                  <span>
                    <PlusOutlined /> הוסף תת ארוע
                  </span>
                </Button>
              </div>
            </>
          )}
        </Form.List>
        <Form.List name="links">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card className="mt-4 border-2" key={key}>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        className="mt-4"
                        label="כותרת קישור"
                        name={[name, "title"]}
                        rules={[{ required: true, message: "שדה חובה" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        className="mt-4"
                        label="קישור"
                        name={[name, "link"]}
                        rules={[
                          { required: true, message: "שדה חובה" },
                          { type: "url", warningOnly: true },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex items-center justify-center">
                    <Button onClick={() => remove(name)}>
                      <span className="text-red-500">
                        <MinusCircleOutlined />
                        הסר קישור
                      </span>
                    </Button>
                  </div>
                </Card>
              ))}
              <div className="flex items-center justify-center mt-2">
                <Button className="w-1/2" onClick={() => add()} block>
                  <span>
                    <PlusOutlined /> הוסף קישור
                  </span>
                </Button>
              </div>
            </>
          )}
        </Form.List>
        <Form.List name="prices">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card className="mt-4 border-2" key={key}>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        className="mt-4"
                        label="כותרת מחיר"
                        name={[name, "title"]}
                        rules={[{ required: true, message: "שדה חובה" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item
                        {...restField}
                        className="mt-4"
                        label="מחיר"
                        name={[name, "sum"]}
                        rules={[
                          { required: true, message: "שדה חובה" },
                          { type: "number", warningOnly: true },
                        ]}
                      >
                        <InputNumber />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="flex items-center justify-center">
                    <Button onClick={() => remove(name)}>
                      <span className="text-red-500">
                        <MinusCircleOutlined />
                        הסר מחיר
                      </span>
                    </Button>
                  </div>
                </Card>
              ))}
              <div className="flex items-center justify-center mt-2">
                <Button className="w-1/2" onClick={() => add()} block>
                  <span>
                    <PlusOutlined /> הוסף מחיר
                  </span>
                </Button>
              </div>
            </>
          )}
        </Form.List>

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

enum Frequency {
  none = "none",
  weekly = "weekly",
  byWeek = "by-week",
  monthly = "monthly",
}

const repeatOptions = [
  { value: Frequency.none, label: "אף פעם" },
  { value: Frequency.weekly, label: "כל  שבוע" },
  { value: Frequency.byWeek, label: "כל כמה שבועות" },
  { value: Frequency.monthly, label: "כל חודש" },
];

const repeatTooltip = (
  <>
    <p>* כל כמה שבועות - לדוגמה, כל שבועים ביום שלישי </p>
    <br />
    <p>* כל חודש - לדוגמה, השבת השניה של כל חודש</p>
  </>
);

function getDayAndWeekOfMonth(date: dayjs.Dayjs) {
  const dayOfWeek = date.day(); // 0 (Sunday) to 6 (Saturday)
  const dayOfMonth = date.date();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);

  return { dayOfWeek, weekOfMonth };
}

function listOfDates(
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

function moveToSameWeekAndDay(
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

const formatMonthlyDate = (date: dayjs.Dayjs) => {
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
