import Form from "antd/es/form"
import Select from "antd/es/select"
import Card from "antd/es/card"
import Row from "antd/es/row"
import Col from "antd/es/col"
import TimePicker from "antd/es/time-picker"
import { eventOptions, tagOptions } from "../../../util/options"
import { Icon } from "../../Common/Icon"
import FormInputModal from "./FormInputModal"
import { FormInputModalType } from "./FormInputModal"

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
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={0} align="middle">
                                <Col md={12} xs={12}>
                                    <FormInputModal
                                        type={FormInputModalType.time}
                                        onClose={(value) => {
                                            form.setFieldsValue({
                                                segments: {
                                                    [name]: {
                                                        "event-start-time":
                                                            value,
                                                    },
                                                },
                                            })
                                        }}
                                        name={`segments.${name}.event-start-time`}
                                        form={form}
                                        anchorEl={
                                            <Form.Item
                                                name={[
                                                    name,
                                                    "event-start-time",
                                                ]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "שדה חובה",
                                                    },
                                                ]}
                                                className="full-width"
                                            >
                                                <TimePicker
                                                    placeholder={"שעת התחלה"}
                                                    minuteStep={5}
                                                    format="HH:mm"
                                                    changeOnScroll
                                                    needConfirm={false}
                                                    inputReadOnly
                                                    open={false}
                                                    allowClear={false}
                                                />
                                            </Form.Item>
                                        }
                                    />
                                </Col>
                                <Col md={12} xs={12}>
                                    <FormInputModal
                                        type={FormInputModalType.time}
                                        onClose={(value) => {
                                            form.setFieldsValue({
                                                segments: {
                                                    [name]: {
                                                        "event-end-time": value,
                                                    },
                                                },
                                            })
                                        }}
                                        name={`segments.${name}.event-end-time`}
                                        form={form}
                                        anchorEl={
                                            <Form.Item
                                                name={[name, "event-end-time"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "שדה חובה",
                                                    },
                                                ]}
                                                className="full-width"
                                            >
                                                <TimePicker
                                                    placeholder={"שעת סיום"}
                                                    minuteStep={5}
                                                    format="HH:mm"
                                                    changeOnScroll
                                                    needConfirm={false}
                                                    inputReadOnly
                                                    open={false}
                                                    allowClear={false}
                                                />
                                            </Form.Item>
                                        }
                                    />
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
                                            mode="tags"
                                            placeholder="תגיות"
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
