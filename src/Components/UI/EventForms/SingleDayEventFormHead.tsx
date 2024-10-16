import {
    Form,
    Input,
    Select,
    DatePicker,
    Row,
    Col,
    Card,
    TimePicker,
} from "antd"

import GooglePlacesInput, {
    IGooglePlaceOption,
} from "../Other/GooglePlacesInput"
import dayjs from "dayjs"
import {
    districtOptions,
    eventOptions,
    tagOptions,
} from "../../../util/options"

import { IAddress } from "../../../util/interfaces"

interface SingleDayEventFormHeadProps {
    form: any
    handleAddressSelect: (place: IGooglePlaceOption) => void
    handleDateChange: (date: dayjs.Dayjs) => void
    handleEndDateChange: (date: dayjs.Dayjs) => void
    eventDate: dayjs.Dayjs
    endDate: dayjs.Dayjs | null
    isEdit: boolean
    teachers: { label: string; value: string }[]
    address?: IAddress
    isTemplate?: boolean
    titleText: string
}

export default function SingleDayEventFormHead({
    handleAddressSelect,
    handleDateChange,
    teachers,
    isTemplate,
    address,
    titleText,
}: SingleDayEventFormHeadProps) {
    return (
        <div className="single-day-event-base-form">
            <Card
                className="event-card"
                title={<span className="event-title">{titleText}</span>}
            >
                <Form.Item
                    name="event-title"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <Input placeholder="*כותרת האירוע" />
                </Form.Item>

                <Form.Item name="event-description">
                    <Input.TextArea rows={6} placeholder="תיאור האירוע" />
                </Form.Item>
                <Form.Item
                    className="form-item"
                    name="district"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <Select options={districtOptions} placeholder="אזור" />
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
                    <Form.Item
                        name="event-start-date"
                        rules={[{ required: true, message: "שדה חובה" }]}
                    >
                        <DatePicker
                            format={"DD/MM"}
                            minDate={dayjs()}
                            maxDate={dayjs().add(3, "months")}
                            onChange={handleDateChange}
                            allowClear={false}
                            defaultValue={null}
                        />
                    </Form.Item>
                )}
            </Card>

            {/* First Segment */}
            <Card className="event-card">
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
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item
                            name="event-time"
                            rules={[{ required: true, message: "שדה חובה" }]}
                            className="full-width"
                        >
                            <TimePicker.RangePicker
                                placeholder={["שעת התחלה", "שעת סיום"]}
                                format="HH:mm"
                                minuteStep={5}
                                changeOnScroll
                                needConfirm={false}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item name="teachers" className="full-width">
                            <Select
                                mode="tags"
                                className="full-width"
                                placeholder="מורים - ניתן להוסיף מורים שלא נמצאים ברשימה"
                                filterOption={(input, option) =>
                                    (option?.label ?? "")
                                        .toLowerCase()
                                        .indexOf(input.toLowerCase()) >= 0
                                }
                                options={teachers}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item name="event-tags" className="full-width">
                            <Select
                                options={tagOptions}
                                mode="multiple"
                                placeholder="תגיות"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </div>
    )
}
