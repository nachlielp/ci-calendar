import { Form, Input, Button, Card, Row, Col, InputNumber } from "antd";
import { Icon } from "../Other/Icon";

export default function AddPricesForm() {
  return (
    <Form.List name="prices">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <Card className="mt-4 border-2" key={key}>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    {...restField}
                    className="mt-4"
                    label="כותרת מחיר"
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
                    label="מחיר"
                    name={[name, "sum"]}
                    rules={[
                      { required: true, message: "שדה חובה" },
                      { type: "number", warningOnly: true },
                    ]}
                  >
                    <InputNumber />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex items-center justify-center">
                <Button onClick={() => remove(name)}>
                  <Icon icon="doNotDisturb" title="הסר מחיר" />
                </Button>
              </div>
            </Card>
          ))}
          <div className="flex items-center justify-center mt-2">
            <Button className="w-1/2" onClick={() => add()} block>
              <Icon icon="addCircle" title="הוסף מחיר" />
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
}
