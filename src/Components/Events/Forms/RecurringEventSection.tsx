import Form from "antd/es/form"
import { useState } from "react"
import '../../../styles/recurring-event-section.scss'
import Checkbox from "antd/es/checkbox/Checkbox"
import { Dayjs } from "dayjs"
import { Col, FormInstance, Row, Select } from "antd/lib"
import { recurringOptions } from "../../../util/options"
import Alert from "antd/es/alert/Alert"
import DateInputModal from "./DateInputModal"
import { utilService } from "../../../util/utilService"

interface RecurringEventSectionProps {
    startDate: Dayjs
    endDate: Dayjs | null
    form: FormInstance
    recurringOption: string | null
    recurringEndDate: Dayjs | null
    handleRecurringOptionChange: (value: string) => void
    handleRecurringEndDateChange: (date: Dayjs) => void
}

const reurring_message =
    "חודשי: חוזר באותו יום בחודש - לדוגמה ב22 לכל חודש \nחודשי - יום בשבוע: חוזר באותו יום באותו מספר שבוע, לדוגמה השבת הראשונה של כל חודש"

export default function RecurringEventSection({
    startDate,
    form,
    endDate,
    recurringOption,
    recurringEndDate,
    handleRecurringOptionChange,
    handleRecurringEndDateChange,
}: RecurringEventSectionProps) {
    const [isChecked, setIsChecked] = useState(false)

    const isMultiDay = !!endDate
    let eventLength = 0
    if (isMultiDay) {
        eventLength = startDate.diff(endDate, "day")
    }

    return (
        <section className="recurring-event-section">
            <hr className="divider" />
            <label className="segment-title">
                אירוע חוזר{" "}
                <span className="segment-description">
                    (יצירת מספר ארועים חוזרים)
                </span>
            </label>
            <Form.Item
                name="recurring-event"
                valuePropName="checked"
                initialValue={false}
            >
                <Checkbox onChange={(e) => setIsChecked(e.target.checked)} />
            </Form.Item>
            {isChecked && (
                <section className="recurring-container">
                    <section className="event-card card boardered-card">
                        <Alert
                            message={reurring_message}
                            type="info"
                            style={{
                                whiteSpace: "pre-wrap",
                                marginBottom: "10px",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                                alignItems: "flex-start",
                                width: "100%",
                            }}
                        >
                            <Row
                                gutter={0}
                                align="middle"
                                className="full-width"
                                style={{ width: "100%", alignItems: "center" }}
                            >
                                <Col lg={10} md={10} xs={10}>
                                    <Form.Item name="recurring-event-option">
                                        <Select
                                            // className="recurring-select"
                                            options={recurringOptions}
                                            style={{ width: "100%" }}
                                            placeholder="תדירות"
                                            size="large"
                                            className="form-input-large"
                                            popupClassName="form-input-large"
                                            onChange={
                                                handleRecurringOptionChange
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <div style={{ marginRight: "1rem" }}></div>
                                <Col lg={10} md={10} xs={10}>
                                    <DateInputModal
                                        name={["recurring-event-end-date"]}
                                        form={form}
                                        placeholder=" תאריך סיום"
                                        handleChange={
                                            handleRecurringEndDateChange
                                        }
                                    />
                                </Col>
                            </Row>
                        </div>
                        <div className="recurring-event-date-list">
                            {recurringOption &&
                                startDate &&
                                recurringEndDate &&
                                utilService
                                    .calculateRecurringEventDates(
                                        startDate,
                                        recurringEndDate,
                                        recurringOption
                                    )
                                    .map((date: Dayjs) => (
                                        <div
                                            key={date.toISOString()}
                                            className="recurring-event-date"
                                        >
                                            יום {date.format("dddd")} -{" "}
                                            {date.format("DD/MM/YYYY")}
                                            {isMultiDay &&
                                                `  יום ${date
                                                    .add(eventLength, "day")
                                                    .format("dddd")} - ${date
                                                    .add(eventLength, "day")
                                                    .format("DD/MM/YYYY")}`}
                                        </div>
                                    ))}
                        </div>
                    </section>
                </section>
            )}
        </section>
    )
}
