import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  TimePicker,
} from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions, eventTypes, districtOptions } from "../../../util/options";
import { IAddress, IEvently, UserType } from "../../../util/interfaces";
import Loading from "../Other/Loading";
import GooglePlacesInput, {
  IGooglePlaceOption,
} from "../Other/GooglePlacesInput";

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
  const { getEvent, currentUser, updateEvent } = useAuthContext();
  const { eventId } = useParams<{ eventId: string }>();
  const [eventData, setEventData] = useState<IEvently | null>(null);
  const [newAddress, setNewAddress] = useState<IAddress | null>(null);
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
    // console.log("EventForm.handleSubmit.values: ", values);

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
        teacher: values["event-teacher"] || "",
      },
    ];
    if (values["sub-events"]) {
      values["sub-events"].forEach((subEvent: any) =>
        subEvents.push({
          type: subEvent.type,
          tags: subEvent.tags || [],
          teacher: subEvent.teacher || "",
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
              defaultValue={address}
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
            />
          </Form.Item>
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
                  changeOnScroll
                  minuteStep={5}
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
    "event-teacher": event.subEvents[0]?.teacher,
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
      teacher: subEvent.teacher,
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

  return { currentFormValues, address: event.address };
}

// const testFormData = {
//   id: "e86221b0-444c-4432-903a-38f06fdc4eb1",
//   address: 'סטודיו נעים סניף שלמה 39 ת"א',
//   createdAt: "2024-04-17T05:26:18.918Z",
//   updatedAt: "2024-04-17T05:26:18.918Z",
//   title: "שיעור שבועי עם רועי שקד בדגש סומטי וטכני",
//   description: "תיאור כולשהו של האירוע",
//   owners: ["sCOY7FqMVMTGrz8ZYCawYIdE0bM2"],
//   links: [
//     {
//       title: "פרטים נוספים",
//       link: "https://www.naim.org.il/contact-impro/",
//     },
//   ],
//   price: [
//     {
//       title: " שיעור",
//       sum: 50,
//     },
//     {
//       title: "גאם",
//       sum: 30,
//     },
//   ],
//   hide: false,
//   subEvents: [
//     {
//       startTime: "2024-04-19T03:00:02.800Z",
//       endTime: "2024-04-19T04:00:02.800Z",
//       type: "class",
//       tags: ["everyone", "pre-registration"],
//       teacher: "רועי שקד",
//     },
//     {
//       type: "jame",
//       tags: ["everyone"],
//       teacher: "",
//       startTime: "2024-04-19T04:00:00.000Z",
//       endTime: "2024-04-19T08:00:00.000Z",
//     },
//     {
//       type: "class",
//       tags: [],
//       teacher: "",
//       startTime: "2024-04-17T08:00:00.000Z",
//       endTime: "2024-04-17T12:00:00.000Z",
//     },
//   ],
//   district: "center",
// };
