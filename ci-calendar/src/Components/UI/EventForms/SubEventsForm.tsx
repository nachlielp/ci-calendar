import { Form, Select, Input, Button, Card, Row, Col, TimePicker } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { eventTypes, tagOptions } from "../../../util/options";

interface ISubEventsFormProps {
  form: any;
  day: string;
}
export default function SubEventsForm({ form, day }: ISubEventsFormProps) {
  const onAddTeacher = () => {
    const name = form.getFieldValue("newTeacher");
    form.setFieldsValue({ newTeacher: "" });
    if (!name) return;
    const teachers = form.getFieldValue("baseTeachers") || [];
    form.setFieldsValue({ baseTeachers: [...teachers, { name }] });
    form.setFieldsValue({ newTeacher: "" });
  };

  const onRemoveTeacher = (index: number) => {
    const teachers = form.getFieldValue("teachers") || [];
    form.setFieldsValue({
      teachers: teachers.filter((_: any, i: any) => i !== index),
    });
  };
  return (
    <Form.List name={day ? [day, "sub-events"] : "sub-events"}>
      {(subEvents, { add, remove }) => (
        <>
          {subEvents.map(({ key, name }) => (
            <Card className="mt-4 border-2" key={key}>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    className="w-full"
                    name={[name, "type"]}
                    label="סוג האירוע"
                    rules={[{ required: true, message: "שדה חובה" }]}
                  >
                    <Select options={eventTypes} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    name={[name, "time"]}
                    label="שעות "
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
                    name={[name, "teacher"]}
                    label="מורה"
                    className="w-full"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    name={[name, "tags"]}
                    label="תגיות"
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
