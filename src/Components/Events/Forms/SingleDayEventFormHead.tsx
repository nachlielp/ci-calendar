import Form, { FormInstance } from "antd/es/form"
import Input from "antd/es/input"
import Select from "antd/es/select"
import DatePicker from "antd/es/date-picker"
import Card from "antd/es/card"
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
import FormInputModal from "./TimeInputModal"

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
    handleAddressSelect,
    handleDateChange,
    teachers,
    orgs,
    isTemplate,
    address,
    titleText,
    form,
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
                    <Input
                        placeholder="*כותרת האירוע"
                        size="large"
                        className="form-input-large-placeholder"
                    />
                </Form.Item>

                <Form.Item name="event-description">
                    <Input.TextArea
                        rows={6}
                        placeholder="תיאור האירוע"
                        className="form-input-large-placeholder"
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
                        className="form-input-large-placeholder"
                        popupClassName="form-input-large-placeholder"
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

                <Form.Item name="event-orgs" className="full-width">
                    <Select
                        mode="multiple"
                        className="full-width"
                        placeholder="ארגונים"
                        filterOption={(input, option) =>
                            (option?.label ?? "")
                                .toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                        }
                        options={orgs}
                    />
                </Form.Item>
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

                <Row gutter={0} align="middle">
                    <Col md={12} xs={12}>
                        <FormInputModal
                            name="first-segment-start-time"
                            form={form}
                            placeholder="שעת התחלה"
                        />
                    </Col>
                    <Col md={12} xs={12}>
                        <FormInputModal
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
                                mode="tags"
                                placeholder="תגיות"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </div>
    )
}
