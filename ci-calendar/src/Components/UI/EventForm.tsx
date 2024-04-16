import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../Auth/AuthContext";
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
import { SetStateAction, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions, eventTypes, districtOptions } from "../../util/options";
import { UserType } from "../../Firebase";
import { IEvently } from "../../util/interfaces";

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

export default function EventForm() {
  const navigate = useNavigate();
  const { currentUser, createEvent } = useAuthContext();
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

  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleDateChange = (date: SetStateAction<dayjs.Dayjs>) => {
    setSelectedDate(date);
  };

  const handleSubmit = async (values: any) => {
    console.log("EventForm.handleSubmit.values: ", values);

    const subEvents = [
      {
        startTime: dayjs(values["event-time"][0]).toISOString(),
        endTime: dayjs(values["event-time"][1]).toISOString(),
        type: values["event-types"],
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
          startTime: dayjs(subEvent.time[0]).toISOString(),
          endTime: dayjs(subEvent.time[1]).toISOString(),
        })
      );
    }

    const event: IEvently = {
      id: uuidv4(),
      address: values["address"],
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
    console.log("EventForm.handleSubmit.event: ", event);
    try {
      await createEvent(event);
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
        initialValues={{
          "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
          "event-time": [
            dayjs.tz(dayjs(selectedDate).hour(0).minute(0), "Asia/Jerusalem"),
            dayjs.tz(dayjs(selectedDate).hour(0).minute(0), "Asia/Jerusalem"),
          ],
          "event-tags": [tagOptions[0].value],
        }}
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
            <Input />
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

        <Card className="mt-4 border-4">
          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Card>
      </Form>
    </Card>
  );
}
