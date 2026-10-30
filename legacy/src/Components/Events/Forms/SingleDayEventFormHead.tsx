import Form, { FormInstance } from "antd/es/form"
import Input from "antd/es/input"
import Select from "antd/es/select"
import Row from "antd/es/row"
import Col from "antd/es/col"

import GooglePlacesInput, {
    IGooglePlaceOption,
} from "../../Common/GooglePlacesInput"
import dayjs from "dayjs"
import {
    districtOptions,
    eventOptions,
    tagOptions,
} from "../../../util/options"

import { IAddress } from "../../../util/interfaces"
import TimeInputModal from "./TimeInputModal"
import DateInputModal from "./DateInputModal"
import Alert from "antd/es/alert/Alert"

interface SingleDayEventFormHeadProps {
    form: FormInstance
    handleAddressSelect: (place: IGooglePlaceOption) => void
    handleDateChange: (date: dayjs.Dayjs) => void
    handleEndDateChange: (date: dayjs.Dayjs) => void
    eventDate: dayjs.Dayjs
    endDate: dayjs.Dayjs | null
    isEdit: boolean
    teachers: { label: string; value: string }[]
    orgs: { label: string; value: string }[]
    address?: IAddress
    isTemplate?: boolean
    titleText: string
}
export default function SingleDayEventFormHead({
    form,
    handleAddressSelect,
    handleDateChange,

    teachers,
    orgs,
    isTemplate,
    address,
    titleText,
}: SingleDayEventFormHeadProps) {
    return (
        <div>
            <section className="event-card card boardered-card">
                <span className="segment-title">{titleText}</span>
                <Form.Item
                    name="event-title"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <Input
                        placeholder="*כותרת האירוע"
                        size="large"
                        className="form-input-large"
                    />
                </Form.Item>

                <Form.Item name="event-description">
                    <Input.TextArea
                        rows={6}
                        placeholder="תיאור האירוע"
                        className="form-input-large"
                    />
                </Form.Item>
                <Form.Item
                    className="form-item"
                    name="district"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <Select
                        options={districtOptions}
                        placeholder="אזור"
                        className="form-input-large"
                        popupClassName="form-input-large"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item
                    className="form-item"
                    name="address"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <GooglePlacesInput
                        onPlaceSelect={handleAddressSelect}
                        defaultValue={address}
                    />
                </Form.Item>

                {!isTemplate && (
                    <DateInputModal
                        name="event-start-date"
                        form={form}
                        placeholder="תאריך "
                        handleChange={handleDateChange}
                    />
                )}

                <Form.Item name="event-orgs" className="full-width">
                    <Select
                        mode="multiple"
                        // className="full-width"
                        placeholder="ארגונים"
                        filterOption={(input, option) =>
                            (option?.label ?? "")
                                .toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                        }
                        options={orgs}
                        className="form-input-large"
                        popupClassName="form-input-large"
                    />
                </Form.Item>
            </section>

            {/* First Segment */}
            <section className="event-card card boardered-card">
                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item
                            className="full-width"
                            name="event-type"
                            rules={[{ required: true, message: "שדה חובה" }]}
                        >
                            <Select
                                options={eventOptions}
                                placeholder="סוג האירוע"
                                className="form-input-large"
                                popupClassName="form-input-large"
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? "")
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item noStyle dependencies={["event-type"]}>
                    {({ getFieldValue }) => {
                        const eventType = getFieldValue("event-type")
                        return eventType === "course" ? (
                            <Form.Item
                                name="course-duration"
                                className="full-width"
                            >
                                <Alert
                                    message="נא לא להזין ללוח קורסים שלא פתוחים להרשמה"
                                    type="info"
                                />
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>

                <Row gutter={0} align="middle">
                    <Col lg={10} md={10} xs={10}>
                        <TimeInputModal
                            name="first-segment-start-time"
                            form={form}
                            placeholder="שעת התחלה"
                        />
                    </Col>
                    <div style={{ marginRight: "1rem" }}></div>
                    <Col lg={10} md={10} xs={10}>
                        <TimeInputModal
                            name="first-segment-end-time"
                            form={form}
                            placeholder="שעת סיום"
                        />
                    </Col>
                </Row>
                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item name="teachers" className="full-width">
                            <Select
                                mode="tags"
                                placeholder="מורים - ניתן להוסיף מורים שלא נמצאים ברשימה"
                                filterOption={(input, option) =>
                                    (option?.label ?? "")
                                        .toLowerCase()
                                        .indexOf(input.toLowerCase()) >= 0
                                }
                                options={teachers}
                                allowClear
                                className="form-input-large"
                                popupClassName="form-input-large"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item name="event-tags" className="full-width">
                            <Select
                                options={tagOptions}
                                mode="tags"
                                placeholder="תגיות"
                                className="form-input-large"
                                popupClassName="form-input-large"
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? "")
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </section>
        </div>
    )
}
