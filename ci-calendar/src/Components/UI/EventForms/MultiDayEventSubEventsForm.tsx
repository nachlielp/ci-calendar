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
import { MinusCircleOutlined } from "@ant-design/icons";

interface IBaseEventFormProps {
  day: number;
  remove: (index: number | number[]) => void;
  teachers: { label: string, value: string }[];
  form: any;
}

export default function MultiDayEventSubEventsForm({
  day,
  remove,
  teachers,
  form,
}: IBaseEventFormProps) {
  return (
    <Card className="mt-4 border-4">
      <Form.Item
        label="תאריך"
        name={[day, "event-date-base"]}
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <DatePicker
          format={"DD/MM"}
          minDate={dayjs()}
          maxDate={dayjs().add(1, "year")}
        />
      </Form.Item>
      <Card className="mt-4 border-2">
        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              className="w-full"
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
              label="מורה"
              name={[day, "event-teachers-base"]}
              className="w-full"
            >
              <Select
                mode="tags"
                style={{ width: '100%' }}
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
              className="w-full"
            >
              <Select options={tagOptions} mode="multiple" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <SubEventsForm day={day.toString()} form={form} teachers={teachers} />

      <div className="flex items-center justify-center mt-4">
        <Button onClick={() => remove(day)}>
          <span className="text-red-500">
            <MinusCircleOutlined /> הסר יום
          </span>
        </Button>
      </div>
    </Card>
  );
}
