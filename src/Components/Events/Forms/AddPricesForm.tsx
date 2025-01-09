import Form from "antd/es/form"
import Input from "antd/es/input"
import Row from "antd/es/row"
import Col from "antd/es/col"
import InputNumber from "antd/es/input-number"
import { Icon } from "../../Common/Icon"
import '../../../styles/add-prices-form.scss'
export default function AddPricesForm() {
    return (
        <section className="add-prices-form">
            <hr className="divider" />
            <label className="segment-title">מחיר</label>
            <Form.List name="prices">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <section
                                className="price-card card boardered-card"
                                key={key}
                            >
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
                                            <InputNumber
                                                placeholder="מחיר"
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
                                            הסרת מחיר
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
                                    <Icon
                                        icon="addCircle"
                                        className="add-icon"
                                    />
                                    <span className="add-button-label">
                                        הוספת מחיר
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
