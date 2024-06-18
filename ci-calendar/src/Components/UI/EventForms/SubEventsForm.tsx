import { Form, Select, Button, Card, Row, Col, TimePicker } from "antd";
import { eventTypes, tagOptions } from "../../../util/options";
import { Icon } from "../Other/Icon";

interface ISubEventsFormProps {
  form: any;
  day: string;
  teachers: { label: string, value: string }[];
}
export default function SubEventsForm({ form, day, teachers }: ISubEventsFormProps) {

  return (
    <Form.List name={day ? [day, "sub-events"] : "sub-events"}>
      {(subEvents, { add, remove }) => (
        <>
          {subEvents.map(({ key, name }) => (
            <Card className="sub-event-card" key={key}>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    className="full-width"
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
                    className="full-width"
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
                  <Form.Item label="מורים" name={[name, "teachers"]} className="full-width">
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
                    name={[name, "tags"]}
                    label="תגיות"
                    className="full-width"
                  >
                    <Select options={tagOptions} mode="multiple" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="button-container">
                <Button onClick={() => remove(name)}>
                  <Icon icon="doNotDisturb" title="הסר תת ארוע" />
                </Button>
              </div>
            </Card>
          ))}
          <div className="add-button-container">
            <Button className="add-button" onClick={() => { add(); form.setFieldsValue({ newSubTeacher: "" }) }} block>
              <Icon icon="addCircle" title="הוסף תת ארוע" />
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
}