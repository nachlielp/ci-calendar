import { useNavigate } from "react-router-dom";
import { DbSimpleEvent } from "../../../drizzle/schema";
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
import { v4 as uuidv4 } from "uuid";

import customParseFormat from "dayjs/plugin/customParseFormat";
import { SetStateAction, useState } from "react";
import { RangePickerProps } from "antd/es/date-picker";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { PlusOutlined } from "@ant-design/icons";
import { limitations, eventTypes, districts } from "../../util/options";

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

export default function SimpleEventForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }

  const [form] = Form.useForm();
  const [addPartTwo, setAddPartTwo] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleDateChange = (date: SetStateAction<dayjs.Dayjs>) => {
    setSelectedDate(date);
  };

  const handleSubmit = async (values: any) => {
    //TODO: setup p_2
    const event: DbSimpleEvent = {
      id: uuidv4(),
      createdAt: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
      title: values["event-title"],
      description: values["event-description"] ?? "",
      types: values["event-types"],
      startTime: values["event-time"][0],
      endTime: values["event-time"][1],
      owners: [currentUser.id],
      teachers: values["event-teacher"],
      limitations: values["event-limitations"],
      linkToEvent: values["link-to-event"],
      linkToPayment: values["link-to-pay"],
      address: values["address"],
      hideEvent: false,
      district: values["district"],
      price: values["price"],
      linkToRegistration: values["link-to-registration"],
      p2_types: addPartTwo ? values["event-types_2"] : "",
      p2_startTime: addPartTwo ? values["event-time_2"][0] : "",
      p2_endTime: addPartTwo ? values["event-time_2"][1] : "",
      p2_price: addPartTwo ? values["price_2"] : "",
      p2_total_price: addPartTwo ? values["total-price"] : "",
    };
    try {
      console.log(`EventForm.handleSubmit.event: `, event);
      // const res = await createEvent(event);
      navigate("/teacher");
      //TODO if res returned with error, show error message and dont update state
      // console.log(`EventForm.handleSubmit.res: `, res);
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
          "event-limitations": [limitations[0].value],
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
            label="סוג האירוע"
            name="event-types"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select options={eventTypes} mode="multiple" />
          </Form.Item>

          <Form.Item
            label="מורה"
            name="event-teacher"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="מגבלות" name="event-limitations">
            <Select options={limitations} mode="multiple" />
          </Form.Item>
          <Form.Item className="mt-4" label="מחיר" name="price">
            <InputNumber addonAfter="₪" />
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
            className="mt-4"
            label="אזור"
            name="district"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select options={districts} />
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
              // defaultValue={dayjs.tz(dayjs(), "Asia/Jerusalem")}
            />
          </Form.Item>

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
        </Card>
        <Button
          className="w-1/2 mt-4"
          onClick={() => setAddPartTwo((prev) => !prev)}
          block
        >
          <span>
            <PlusOutlined />
            {!addPartTwo ? "הוסף חלק שני" : "הסר חלק שני"}
          </span>
        </Button>
        {addPartTwo && (
          <Card className="mt-4 border-4">
            <Form.Item
              label="סוג האירוע"
              name="event-types_2"
              rules={[{ required: addPartTwo, message: "שדה חובה" }]}
            >
              <Select options={eventTypes} mode="multiple" />
            </Form.Item>
            <Form.Item
              label="שעות פעילות"
              name="event-time_2"
              rules={[{ required: addPartTwo, message: "שדה חובה" }]}
              className="w-full"
            >
              <TimePicker.RangePicker
                format="HH:mm"
                changeOnScroll
                needConfirm={false}
              />
            </Form.Item>
            <Form.Item className="mt-4" label="מחיר חלק שני" name="price_2">
              <InputNumber addonAfter="₪" />
            </Form.Item>
            <Form.Item className="mt-4" label="מחיר כולל" name="total-price">
              <InputNumber addonAfter="₪" />
            </Form.Item>
          </Card>
        )}
        <Card className="mt-4 border-4">
          <Form.Item
            className="mt-4"
            label="קישור לאירוע"
            name="link-to-event"
            rules={[{ type: "url", warningOnly: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            className="mt-4"
            label="קישור לתשלום"
            name="link-to-pay"
            rules={[{ type: "url", warningOnly: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="קישור להרשמה"
            name="link-to-registration"
            rules={[{ type: "url", warningOnly: true }]}
          >
            <Input />
          </Form.Item>
        </Card>

        <Button type="primary" htmlType="submit" className="w-full mt-4">
          צור אירוע
        </Button>
      </Form>
    </Card>
  );
}

export const disabledDate: RangePickerProps["disabledDate"] = (current) => {
  return (
    current &&
    (current < dayjs().startOf("day") ||
      current > dayjs().add(1, "year").endOf("day"))
  );
};
