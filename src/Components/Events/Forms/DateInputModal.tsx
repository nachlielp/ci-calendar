import Modal from "antd/es/modal"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import Form, { FormInstance } from "antd/es/form"
import Calendar, { CalendarProps } from "antd/es/calendar"
import isBetween from "dayjs/plugin/isBetween"
import "dayjs/locale/he"
import utc from "dayjs/plugin/utc"
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.locale("he")
import hb from "antd/locale/he_IL"
import ConfigProvider from "antd/es/config-provider"
import { Icon } from "../../Common/Icon"
import DatePicker from "antd/es/date-picker"
import "../../../styles/date-input-modal.css"

export enum DateInputModalType {
    date = "date",
    time = "time",
    timeRange = "timeRange",
    text = "text",
}

interface DateInputModalProps {
    name: string | string[]
    form: FormInstance
    onClose?: (value: Dayjs | null) => void
    placeholder?: string
}

//Notice, when name is an array, pass onClose as a function that takes the value and sets the form field value
const DateInputModal = ({
    name,
    form,
    onClose,
    placeholder,
}: DateInputModalProps) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState<Dayjs>(dayjs())

    useEffect(() => {
        if (open) {
            const formValue = form.getFieldValue(name)
            setValue(formValue ? dayjs(formValue) : dayjs())
        }
    }, [open, form, name])

    const onChange = (newValue: Dayjs) => {
        setValue(newValue)
    }

    const handleClose = () => {
        setOpen(false)
        if (value) {
            form.setFieldValue(name, value)
        }

        if (onClose) {
            onClose(value || null)
        }
    }

    const dateCellRender = (current: Dayjs) => {
        const isDisabled = current.isBefore(dayjs())
        return (
            <div
                className={`calendar-view__day-cell ${
                    isDisabled && "disabled"
                }`}
                style={{ cursor: "pointer" }}
            >
                <span>{current.date()}</span>
            </div>
        )
    }

    const cellRender: CalendarProps<Dayjs>["cellRender"] = (day, info) => {
        if (info.type === "date") return dateCellRender(day)
        return info.originNode
    }

    const prevMonth = () => {
        if (value.isSame(dayjs(), "month")) return
        const newValue = value.subtract(1, "month")
        const oneMonthAgo = dayjs().subtract(1, "month").startOf("month")
        if (newValue.isAfter(oneMonthAgo)) {
            setValue(newValue)
        }
    }

    const nextMonth = () => {
        const newValue = value.add(1, "month")
        const threeMonthsAhead = dayjs().add(3, "months").endOf("month")
        if (newValue.isBefore(threeMonthsAhead)) {
            setValue(newValue)
        }
    }

    return (
        <>
            <div onClick={() => setOpen(true)}>
                <Form.Item
                    name={name}
                    rules={[
                        {
                            required: true,
                            message: "שדה חובה",
                        },
                    ]}
                    className="full-width"
                >
                    <DatePicker
                        format={"DD/MM"}
                        open={false}
                        allowClear={false}
                        inputReadOnly
                        defaultValue={null}
                        placeholder={placeholder || ""}
                        size="large"
                        className="form-input-large"
                        popupClassName="form-input-large"
                    />
                </Form.Item>
            </div>
            <Modal open={open} onCancel={handleClose} footer={null}>
                <section className="date-input-modal">
                    <header className="calendar-controller">
                        <Icon
                            onClick={prevMonth}
                            icon="chevron_right"
                            className="back"
                        />
                        <label className="label">
                            {value.format("MMMM YYYY")}
                        </label>
                        <Icon
                            onClick={nextMonth}
                            icon="chevron_right"
                            className="next"
                        />
                    </header>
                    <ConfigProvider locale={hb} direction="rtl">
                        <Calendar
                            value={value}
                            mode="month"
                            onChange={onChange}
                            fullscreen={false}
                            fullCellRender={cellRender}
                            onSelect={onChange}
                            headerRender={() => <div></div>}
                            disabledDate={(current) =>
                                current.isBefore(dayjs().subtract(1, "day"))
                            }
                        />
                    </ConfigProvider>
                </section>
            </Modal>
        </>
    )
}

export default DateInputModal
