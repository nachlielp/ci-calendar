import Form, { FormInstance } from "antd/es/form"
import Input from "antd/es/input"
import Select from "antd/es/select"
import Card from "antd/es/card"
import GooglePlacesInput, {
    IGooglePlaceOption,
} from "../../Common/GooglePlacesInput"
import { IAddress, UserOption } from "../../../util/interfaces"
import { districtOptions, eventOptions } from "../../../util/options"
import DateInputModal from "./DateInputModal"
import Row from "antd/es/row"
import Col from "antd/es/col"

interface IMultiDayFormHeadProps {
    handleAddressSelect: (place: IGooglePlaceOption) => void
    address: IAddress | undefined
    isTemplate: boolean
    teachers: UserOption[]
    orgs: UserOption[]
    titleText: string
    form: FormInstance<any>
}

export default function MultiDayFormHead({
    handleAddressSelect,
    address,
    isTemplate,
    teachers,
    orgs,
    titleText,
    form,
}: IMultiDayFormHeadProps) {
    return (
        <Card
            className="multi-day-form-head-card"
            title={<span className="segment-title">{titleText}</span>}
        >
            <Form.Item
                name="event-title"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Input
                    placeholder="כותרת "
                    className="form-input-large"
                    size="large"
                />
            </Form.Item>
            <Form.Item name="event-description">
                <Input.TextArea
                    rows={6}
                    placeholder="תיאור האירוע"
                    className="form-input-large"
                    size="large"
                />
            </Form.Item>
            <Form.Item
                className="multi-day-form-head-item"
                name="district"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Select
                    options={districtOptions}
                    placeholder="אזור"
                    className="form-input-large"
                    popupClassName="form-input-large"
                />
            </Form.Item>
            <Form.Item
                className="multi-day-form-head-item"
                name="address"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <GooglePlacesInput
                    onPlaceSelect={handleAddressSelect}
                    defaultValue={address}
                />
            </Form.Item>
            {!isTemplate && (
                <Row gutter={0} align="middle">
                    <Col md={12} xs={12}>
                        <DateInputModal
                            name="event-start-date"
                            form={form}
                            placeholder="תאריך התחלה"
                        />
                    </Col>
                    <Col md={12} xs={12}>
                        <DateInputModal
                            name="event-end-date"
                            form={form}
                            placeholder="תאריך סיום"
                        />
                    </Col>
                </Row>
            )}

            <Form.Item
                className="multi-day-form-head-full-width"
                name="main-event-type"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Select
                    options={eventOptions}
                    placeholder="סוג האירוע"
                    className="form-input-large"
                    popupClassName="form-input-large"
                />
            </Form.Item>
            <Form.Item name="multi-day-event-teachers" className="full-width">
                <Select
                    mode="tags"
                    placeholder="מורים - ניתן להוסיף מורים שלא נמצאים ברשימה"
                    filterOption={(input, option) =>
                        (option?.label ?? "")
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                    }
                    options={teachers}
                    className="form-input-large"
                    popupClassName="form-input-large"
                />
            </Form.Item>
            <Form.Item name="event-orgs" className="full-width">
                <Select
                    mode="tags"
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
        </Card>
    )
}
