import { useNavigate } from "react-router-dom";
import { UserType } from "../../../drizzle/schema";
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
  Switch,
  TimePicker,
} from "antd";
// import { v4 as uuidv4 } from "uuid";

const { RangePicker } = DatePicker;
import customParseFormat from "dayjs/plugin/customParseFormat";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { SetStateAction, useState } from "react";
// import { RangePickerProps } from "antd/es/date-picker";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { disabledDate } from "./SimpleEventForm";
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

export default function EventForm() {
  const navigate = useNavigate();
  const authContext = useAuthContext();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser } = authContext;
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
  const [isSingleDay, setIsSingleDay] = useState(true);
  const [isRequiredRegistration, setIsRequiredRegistration] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isSubFields, setIsSubFields] = useState(false);

  const handleDateChange = (date: SetStateAction<dayjs.Dayjs>) => {
    setSelectedDate(date);
  };
  const onSwitchSingleDayChange = (checked: boolean) => {
    setIsSingleDay(checked);
  };
  const onSwitchRegistrationChange = (checked: boolean) => {
    setIsRequiredRegistration(checked);
  };

  const handleSubmit = async (values: any) => {
    console.log("EventForm.handleSubmit.values: ", values);
    // const event: DbBasicEvent = {
    //   id: uuidv4(),
    //   createdAt: dayjs().toISOString(),
    //   updatedAt: dayjs().toISOString(),
    //   title: values["event-title"],
    //   description: values["event-description"] || "",
    //   types: values["event-types"],
    //   startTime: values["event-time"][0],
    //   endTime: values["event-time"][1],
    //   owners: [currentUser.id],
    //   linkToEvent: values["link-to-event"],
    //   linkToPayment: values["link-to-pay"],
    //   limitations: values["event-limitations"],
    //   address: values["address"],
    //   hideEvent: false,
    //   subEvents: values["sub-events"],
    //   district: values["district"],
    //   registration: values["is-registration-required"],
    //   linkToRegistration: values["link-to-registration"] || "",
    // };
    try {
      // console.log("EventForm.handleSubmit.event: ", event);
      // const res = await authContext.createEvent(event);
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
        onValuesChange={(_, allValues) => {
          const subEvents = allValues["sub-events"] || [];
          setIsSubFields(subEvents.length > 0);
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
          <Form.Item className="mr-10" name="is-single-day">
            <Switch
              defaultChecked
              onChange={onSwitchSingleDayChange}
              checkedChildren="חד יומי"
              unCheckedChildren="רב יומי"
              disabled={true}
            />
          </Form.Item>
          <Form.Item
            label="סוג האירוע"
            name="event-types"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select options={eventTypes} mode="multiple" />
          </Form.Item>

          {isSingleDay ? (
            <>
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
            </>
          ) : (
            <Form.Item
              label="תאריך"
              name="event-date-range"
              rules={[{ required: true, message: "שדה חובה" }]}
            >
              <RangePicker
                disabledDate={disabledDate}
                showTime={{
                  format: "HH:mm",
                  hideDisabledOptions: true,
                  use12Hours: false,
                }}
                format="DD/MM HH:mm"
                needConfirm={false}
              />
            </Form.Item>
          )}

          <Form.Item label="מורה" name="event-teacher">
            <Input />
          </Form.Item>

          <Form.Item label="מגבלות" name="event-limitations">
            <Select options={limitations} mode="multiple" />
          </Form.Item>
          <Form.Item
            className="mt-4"
            label="מחיר"
            name="price"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <InputNumber addonAfter="₪" />
          </Form.Item>
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
                  {!isSingleDay && (
                    <Row gutter={10} align="middle">
                      <Col md={24} xs={24}>
                        <Form.Item
                          {...restField}
                          label="תאריך"
                          name={[name, "date"]}
                          rules={[{ required: true, message: "שדה חובה" }]}
                          className="w-full"
                        >
                          <DatePicker
                            format={"DD/MM"}
                            minDate={dayjs()}
                            maxDate={dayjs().add(1, "year")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
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
                        label="מגבלות"
                        name={[name, "limitations"]}
                        className="w-full"
                      >
                        <Select options={limitations} mode="multiple" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                      <Form.Item label="מחיר" name={[name, "price"]}>
                        <InputNumber addonAfter="₪" />
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

        <Card className="mt-4 border-4">
          {isSubFields && (
            <Form.Item className="mt-4" label="מחיר כולל" name="total-price">
              <InputNumber addonAfter="₪" />
            </Form.Item>
          )}
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
            label="מחוז"
            name="district"
            rules={[{ required: true, message: "שדה חובה" }]}
          >
            <Select options={districts} />
          </Form.Item>
          <Form.Item
            className="mt-4"
            label="קישור לארוע"
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
          <Form.Item className="mr-10" name="is-registration-required">
            <Switch
              defaultChecked={isRequiredRegistration}
              onChange={onSwitchRegistrationChange}
              checkedChildren="צריך להרשם מראש"
              unCheckedChildren="לא צריך להרשם מראש"
            />
          </Form.Item>
          {isRequiredRegistration && (
            <Form.Item
              label="קישור להרשמה"
              name="link-to-registration"
              rules={[{ type: "url", warningOnly: true }]}
            >
              <Input />
            </Form.Item>
          )}
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
