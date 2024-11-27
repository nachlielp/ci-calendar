import Form from "antd/es/form"
import Input from "antd/es/input"
import Card from "antd/es/card"
import Row from "antd/es/row"
import Col from "antd/es/col"
import InputNumber from "antd/es/input-number"
import { Icon } from "../../Common/Icon"

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
                                        name={[name, "title"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
                                        ]}
                                    >
                                        <Input placeholder="כותרת " />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={10} align="middle">
                                <Col md={24} xs={24}>
                                    <Form.Item
                                        {...restField}
                                        className="price-form-item"
                                        name={[name, "sum"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
                                            {
                                                type: "number",
                                                warningOnly: true,
                                            },
                                        ]}
                                    >
                                        <InputNumber placeholder="מחיר" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="button-container">
                                <button
                                    className="add-button-50"
                                    onClick={() => remove(name)}
                                >
                                    <Icon
                                        icon="doNotDisturb"
                                        title="הסרת מחיר"
                                    />
                                </button>
                            </div>
                        </Card>
                    ))}
                    <div className="add-button-container">
                        <button className="add-button" onClick={() => add()}>
                            <span className="add-button-content">
                                <Icon
                                    icon="addCircle"
                                    className="add-icon"
                                    title="הוספת מחיר"
                                />
                            </span>
                        </button>
                    </div>
                </>
            )}
        </Form.List>
    )
}
