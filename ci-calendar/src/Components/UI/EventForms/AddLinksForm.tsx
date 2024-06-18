import { Card, Row, Col, Form, Input, Button } from "antd";
import { Icon } from "../Other/Icon";

export default function AddLinksForm() {
  return (
    <Form.List name="links">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <Card className="link-card" key={key}>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    {...restField}
                    className="link-form-item"
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
                    className="link-form-item"
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

              <div className="button-container">
                <Button onClick={() => remove(name)}>
                  <Icon icon="doNotDisturb" title="הסר קישור" />
                </Button>
              </div>
            </Card>
          ))}
          <div className="add-button-container">
            <Button className="add-button" onClick={() => add()} block>
              <span className="add-button-content">
                <Icon icon="addCircle" className="add-icon" title="הוסף קישור" />
              </span>
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
}