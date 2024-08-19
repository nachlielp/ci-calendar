import { Form, Select, Card, Row, Col, TimePicker } from "antd";
import { eventTypes, tagOptions } from "../../../util/options";
import { Icon } from "../Other/Icon";

interface ISubEventsFormProps {
  form: any;
  day: string;
  teachers: { label: string; value: string }[];
}
export default function SubEventsForm({
  form,
  day,
  teachers,
}: ISubEventsFormProps) {
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
                    rules={[{ required: true, message: "שדה חובה" }]}
                  >
                    <Select options={eventTypes} placeholder="סוג האירוע" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    name={[name, "time"]}
                    rules={[{ required: true, message: "שדה חובה" }]}
                    className="full-width"
                  >
                    <TimePicker.RangePicker
                      placeholder={["שעת התחלה", "שעת סיום"]}
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
                  <Form.Item name={[name, "teachers"]} className="full-width">
                    <Select
                      mode="tags"
                      className="full-width"
                      placeholder="מורים"
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      options={teachers}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item name={[name, "tags"]} className="full-width">
                    <Select
                      options={tagOptions}
                      mode="multiple"
                      placeholder="תגיות"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="button-container">
                <button className="add-button-50" onClick={() => remove(name)}>
                  <Icon icon="doNotDisturb" title="הסר אירוע המשך" />
                </button>
              </div>
            </Card>
          ))}
          <div className="add-button-container">
            <button
              className="add-button"
              onClick={() => {
                add();
                form.setFieldsValue({ newSubTeacher: "" });
              }}
            >
              <Icon icon="addCircle" title="הוספת ארוע המשך" />
            </button>
          </div>
        </>
      )}
    </Form.List>
  );
}
