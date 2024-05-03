import { Form, Select, Input, Button, Card, Row, Col, TimePicker } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { eventTypes, tagOptions } from "../../../util/options";

interface ISubEventsFormProps {
  day: string;
}
export default function SubEventsForm({ day }: ISubEventsFormProps) {
  return (
    <Form.List name={`${day}-sub-events`}>
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
                    label="שעות "
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
  );
}
