import { Form, Input, Select, DatePicker, Card } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { districtOptions, eventOptions } from "../../../util/options"
import GooglePlacesInput, {
    IGooglePlaceOption,
} from "../Other/GooglePlacesInput"
import { IAddress, UserOption } from "../../../util/interfaces"

interface IMultiDayFormHeadProps {
    handleAddressSelect: (place: IGooglePlaceOption) => void
    handleDateChange: (dates: [Dayjs, Dayjs]) => void
    address: IAddress | undefined
    isTemplate: boolean
    teachers: UserOption[]
    titleText: string
}

export default function MultiDayFormHead({
    handleAddressSelect,
    handleDateChange,
    address,
    isTemplate,
    teachers,
    titleText,
}: IMultiDayFormHeadProps) {
    function onDatesChange(dates: [Dayjs, Dayjs]) {
        handleDateChange(dates)
    }
    return (
        <Card
            className="multi-day-form-head-card"
            title={
                <span className="multi-day-form-head-title">{titleText}</span>
            }
        >
            <Form.Item
                name="event-title"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Input placeholder="כותרת " />
            </Form.Item>
            <Form.Item name="event-description">
                <Input.TextArea rows={6} placeholder="תיאור האירוע" />
            </Form.Item>
            <Form.Item
                className="multi-day-form-head-item"
                name="district"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Select options={districtOptions} placeholder="אזור" />
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
                <Form.Item
                    name="event-dates"
                    rules={[
                        { required: true, message: "שדה חובה" },
                        {
                            validator: (_, value) => {
                                if (
                                    !value ||
                                    value.length !== 2 ||
                                    !value[0] ||
                                    !value[1]
                                ) {
                                    return Promise.reject(
                                        new Error("יש לבחור תאריך התחלה וסיום")
                                    )
                                }
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <DatePicker.RangePicker
                        placeholder={["תאריך התחלה", "תאריך סיום"]}
                        className="single-month"
                        format={"DD/MM"}
                        minDate={dayjs()}
                        maxDate={dayjs().add(1, "year")}
                        mode={["date", "date"]}
                        onChange={(
                            dates: [Dayjs | null, Dayjs | null] | null
                        ) => {
                            if (dates) {
                                onDatesChange(dates as [Dayjs, Dayjs])
                            }
                        }}
                    />
                </Form.Item>
            )}
            <Form.Item
                className="multi-day-form-head-full-width"
                name="main-event-type"
                rules={[{ required: true, message: "שדה חובה" }]}
            >
                <Select options={eventOptions} placeholder="סוג האירוע" />
            </Form.Item>
            <Form.Item name="multi-day-event-teachers" className="full-width">
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
                />
            </Form.Item>
        </Card>
    )
}
