import { Form, Input, Button, Card, Row, Col, InputNumber } from "antd";
import { Icon } from "../Other/Icon";

export default function AddPricesForm() {
  return (
    <Form.List name="prices">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => (
            <Card className="price-card" key={key}>
              <Row gutter={10} align="middle">
                <Col md={24} xs={24}>
                  <Form.Item
                    {...restField}
                    className="price-form-item"
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
                    className="price-form-item"
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

              <div className="button-container">
                <Button onClick={() => remove(name)}>
                  <Icon icon="doNotDisturb" title="הסר מחיר" />
                </Button>
              </div>
            </Card>
          ))}
          <div className="add-button-container">
            <button className="add-button" onClick={() => add()}>
              <span className="add-button-content">
                <Icon icon="addCircle" className="add-icon" title="הוסף מחיר" />
              </span>
            </button>
          </div>
        </>
      )}
    </Form.List>
  );
}
