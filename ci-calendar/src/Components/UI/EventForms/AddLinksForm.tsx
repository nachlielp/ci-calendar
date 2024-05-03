import { Card, Row, Col, Form, Input, Button } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

export default function AddLinksForm() {
  return (
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
  );
}
