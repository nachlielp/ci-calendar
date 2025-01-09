import Row from "antd/es/row"
import Col from "antd/es/col"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { Icon } from "../../Common/Icon"
import '../../../styles/add-links-form.scss'

export default function AddLinksForm() {
    return (
        <section className="add-links-form">
            <hr className="divider" />
            <label className="segment-title">
                קישור{" "}
                <span className="segment-description">
                    (יופיע ככפתור בעמוד האירוע)
                </span>
            </label>
            <Form.List name="links">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <section
                                className="link-card card boardered-card"
                                key={key}
                            >
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
                                            <Input
                                                placeholder="כותרת"
                                                className="form-input-large"
                                            />
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
                                            <Input
                                                placeholder="קישור"
                                                className="form-input-large"
                                            />
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
                            </section>
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
