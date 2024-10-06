import {
    Form,
    Input,
    Select,
    DatePicker,
    Tooltip,
    Row,
    Col,
    Card,
    InputNumber,
    List,
    TimePicker,
} from "antd"

import VirtualList from "rc-virtual-list"
import GooglePlacesInput, {
    IGooglePlaceOption,
} from "../Other/GooglePlacesInput"
import dayjs from "dayjs"
import { districtOptions, eventTypes, tagOptions } from "../../../util/options"
import {
    EventFrequency,
    formatMonthlyDate,
    listOfDates,
    repeatOptions,
    repeatEventTooltip,
} from "./SingleDayEventForm"
import { IAddress } from "../../../util/interfaces"
import { Icon } from "../Other/Icon"

interface ISingleDayEventBaseFormProps {
    form: any
    handleAddressSelect: (place: IGooglePlaceOption) => void
    handleDateChange: (date: dayjs.Dayjs) => void
    handleEndDateChange: (date: dayjs.Dayjs) => void
    handleRepeatChange?: () => void
    repeatOption?: EventFrequency
    eventDate: dayjs.Dayjs
    endDate: dayjs.Dayjs | null
    isEdit: boolean
    teachers: { label: string; value: string }[]
    address?: IAddress
}

export default function SingleDayEventBaseForm({
    form,
    handleAddressSelect,
    handleDateChange,
    handleEndDateChange,
    handleRepeatChange,
    teachers,
    repeatOption,
    eventDate,
    endDate,
    isEdit,
    address,
}: ISingleDayEventBaseFormProps) {
    return (
        <div className="single-day-event-base-form">
            <Card
                className="event-card"
                title={<span className="event-title">הוספת אירוע חד יומי</span>}
            >
                <Form.Item
                    name="event-title"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <Input placeholder="*כותרת " />
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

                <Form.Item
                    name="event-date"
                    rules={[{ required: true, message: "שדה חובה" }]}
                >
                    <DatePicker
                        format={"DD/MM"}
                        minDate={dayjs()}
                        maxDate={dayjs().add(3, "months")}
                        onChange={handleDateChange}
                        allowClear={false}
                        defaultValue={dayjs(eventDate, "DD/MM")}
                    />
                </Form.Item>

                {!isEdit && (
                    <>
                        <article className="row">
                            <Form.Item
                                className="form-item full-width"
                                name="event-repeat"
                                rules={[
                                    { required: true, message: "שדה חובה" },
                                ]}
                            >
                                <Select
                                    options={repeatOptions}
                                    onChange={handleRepeatChange}
                                    placeholder="חזרה"
                                />
                            </Form.Item>
                            <Form.Item
                                className="form-item "
                                name="event-repeat"
                            >
                                <Tooltip title={repeatEventTooltip}>
                                    <span>
                                        <Icon icon="info" />
                                    </span>
                                </Tooltip>
                            </Form.Item>
                        </article>
                        {repeatOption === EventFrequency.byWeek && (
                            <Form.Item
                                label="שבועות"
                                name="event-repeat-week-interval"
                                className="form-item"
                                rules={[
                                    { required: true, message: "שדה חובה" },
                                ]}
                            >
                                <InputNumber min={1} precision={0} />
                            </Form.Item>
                        )}
                        {repeatOption === EventFrequency.monthly && (
                            <Form.Item
                                label="תדירות"
                                name="event-repeat-week-frequency"
                                className="form-item"
                            >
                                <Input
                                    placeholder={formatMonthlyDate(eventDate)}
                                    disabled
                                />
                            </Form.Item>
                        )}
                        {repeatOption !== EventFrequency.none && (
                            <>
                                <Form.Item
                                    name="event-repeat-end-date"
                                    className="form-item"
                                    rules={[
                                        { required: true, message: "שדה חובה" },
                                    ]}
                                >
                                    <DatePicker
                                        placeholder="סיום חזרה"
                                        format={"DD/MM"}
                                        minDate={eventDate}
                                        maxDate={dayjs().add(3, "months")}
                                        onChange={handleEndDateChange}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="תאריכים"
                                    name="event-list-of-dates"
                                    className="form-item"
                                >
                                    {endDate && repeatOption && (
                                        <List>
                                            <VirtualList
                                                data={listOfDates(
                                                    eventDate,
                                                    endDate,
                                                    repeatOption,
                                                    form.getFieldValue(
                                                        "event-repeat-week-interval"
                                                    )
                                                )}
                                                height={200}
                                                itemHeight={47}
                                                itemKey={(item) =>
                                                    item.format("DD/MM/YYYY") +
                                                    item.valueOf()
                                                }
                                            >
                                                {(
                                                    date: dayjs.Dayjs,
                                                    index: number
                                                ) => (
                                                    <List.Item
                                                        key={index}
                                                        className="list-item"
                                                    >
                                                        <List.Item.Meta
                                                            key={index}
                                                            title={date.format(
                                                                "DD/MM"
                                                            )}
                                                        />
                                                    </List.Item>
                                                )}
                                            </VirtualList>
                                        </List>
                                    )}
                                </Form.Item>
                            </>
                        )}
                    </>
                )}
            </Card>

            <Card className="event-card">
                <Row gutter={10} align="middle">
                    <Col md={24} xs={24}>
                        <Form.Item
                            className="full-width"
                            name="event-types"
                            rules={[{ required: true, message: "שדה חובה" }]}
                        >
                            <Select
                                options={eventTypes}
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
                                placeholder="מורים"
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
