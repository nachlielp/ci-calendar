import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Select,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import { eventTypes, tagOptions } from "../../../util/options";
import SubEventsForm from "./SubEventsForm";
import { Icon } from "../Other/Icon";

interface IBaseEventFormProps {
  day: number;
  remove: (index: number | number[]) => void;
  teachers: { label: string, value: string }[];
  form: any;
  limits: {
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
  };
}

export default function MultiDayEventSubEventsForm({
  day,
  remove,
  teachers,
  form,
  limits
}: IBaseEventFormProps) {
  return (
    <Card className="event-card">
      <Form.Item
        label="תאריך"
        name={[day, "event-date-base"]}
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <DatePicker
          format={"DD/MM"}
          minDate={limits.start}
          maxDate={limits.end}
        />
      </Form.Item>
      <Card className="sub-event-card">
        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              className="full-width"
              label="סוג האירוע"
              name={[day, "event-type-base"]}
              rules={[{ required: true, message: "שדה חובה" }]}
            >
              <Select options={eventTypes} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              label="שעות "
              name={[day, "event-time-base"]}
              rules={[{ required: true, message: "שדה חובה" }]}
              className="full-width"
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
              label="מורה"
              name={[day, "event-teachers-base"]}
              className="full-width"
            >
              <Select
                mode="tags"
                className="full-width"
                placeholder="Select or type"
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().indexOf(input.toLowerCase()) >= 0}
                options={teachers}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              label="תגיות"
              name={[day, "event-tags-base"]}
              className="full-width"
            >
              <Select options={tagOptions} mode="multiple" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <SubEventsForm day={day.toString()} form={form} teachers={teachers} />

      <div className="button-container">
        <Button onClick={() => remove(day)}>
          <span className="remove-button">
            <Icon icon="doNotDisturb" title="הסר יום" />
          </span>
        </Button>
      </div>
    </Card>
  );
}