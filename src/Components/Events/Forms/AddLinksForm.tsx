import Card from "antd/es/card"
import Row from "antd/es/row"
import Col from "antd/es/col"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { Icon } from "../../Common/Icon"

export default function AddLinksForm() {
    return (
        <section className="add-links-form">
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
                                                {
                                                    type: "url",
                                                    warningOnly: true,
                                                },
                                            ]}
                                        >
                                            <Input placeholder="קישור" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div className="remove-button-container">
                                    <button
                                        className="remove-button"
                                        onClick={() => remove(name)}
                                    >
                                        <Icon icon="doNotDisturb" />
                                        <span className="remove-button-label">
                                            הסרת קישור
                                        </span>
                                    </button>
                                </div>
                            </Card>
                        ))}
                        <div className="add-button-container">
                            <button
                                className="add-button"
                                onClick={() => add()}
                            >
                                <span className="add-button-content">
                                    <Icon icon="addCircle" />
                                    <span className="add-button-label">
                                        הוספת קישור
                                    </span>
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </Form.List>
        </section>
    )
}
