import Form from "antd/es/form"
import Select from "antd/es/select"
import Card from "antd/es/card"
import Row from "antd/es/row"
import Col from "antd/es/col"
import TimePicker from "antd/es/time-picker"
import { eventOptions, tagOptions } from "../../../util/options"
import { Icon } from "../../Common/Icon"

interface EventSegmentsFormProps {
    form: any
    teachers: { label: string; value: string }[]
}

export default function EventSegmentsForm({
    form,
    teachers,
}: EventSegmentsFormProps) {
    return (
        <Form.List name="segments">
            {(segments, { add, remove }) => (
                <>
                    {segments.map(({ key, name }) => (
                        <Card className="segment-card" key={key}>
                            <Row gutter={10} align="middle">
                                <Col md={24} xs={24}>
                                    <Form.Item
                                        className="full-width"
                                        name={[name, "event-type"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
                                        ]}
                                    >
                                        <Select
                                            options={eventOptions}
                                            placeholder="סוג האירוע"
                                            style={{ fontSize: "16px" }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={10} align="middle">
                                <Col md={24} xs={24}>
                                    <Form.Item
                                        name={[name, "event-time"]}
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
                                        ]}
                                        className="full-width"
                                    >
                                        <TimePicker.RangePicker
                                            placeholder={[
                                                "שעת התחלה",
                                                "שעת סיום",
                                            ]}
                                            minuteStep={5}
                                            format="HH:mm"
                                            changeOnScroll
                                            needConfirm={false}
                                            style={{ fontSize: "16px" }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={10} align="middle">
                                <Col md={24} xs={24}>
                                    <Form.Item
                                        name={[name, "teachers"]}
                                        className="full-width"
                                    >
                                        <Select
                                            mode="tags"
                                            className="full-width"
                                            placeholder="מורים - ניתן להוסיף מורים שלא נמצאים ברשימה"
                                            filterOption={(input, option) =>
                                                (option?.label ?? "")
                                                    .toLowerCase()
                                                    .indexOf(
                                                        input.toLowerCase()
                                                    ) >= 0
                                            }
                                            options={teachers}
                                            style={{ fontSize: "16px" }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={10} align="middle">
                                <Col md={24} xs={24}>
                                    <Form.Item
                                        name={[name, "event-tags"]}
                                        className="full-width"
                                    >
                                        <Select
                                            options={tagOptions}
                                            mode="multiple"
                                            placeholder="תגיות"
                                            style={{ fontSize: "16px" }}
                                        />
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
                                        title="הסר אירוע המשך"
                                    />
                                </button>
                            </div>
                        </Card>
                    ))}
                    <div className="add-button-container">
                        <button
                            className="add-button"
                            onClick={() => {
                                add()
                                form.setFieldsValue({ newSubTeacher: "" })
                            }}
                        >
                            <Icon icon="addCircle" title="הוספת ארוע המשך" />
                        </button>
                    </div>
                </>
            )}
        </Form.List>
    )
}
