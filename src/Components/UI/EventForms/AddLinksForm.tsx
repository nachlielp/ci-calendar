import Card from "antd/es/card"
import Row from "antd/es/row"
import Col from "antd/es/col"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { Icon } from "../Other/Icon"

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
                                        className="link-form-item"
                                        name={[name, "link"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
                                            { type: "url", warningOnly: true },
                                        ]}
                                    >
                                        <Input placeholder="קישור" />
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
                                        title="הסרת קישור"
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
                                    title="הוספת קישור"
                                />
                            </span>
                        </button>
                    </div>
                </>
            )}
        </Form.List>
    )
}
