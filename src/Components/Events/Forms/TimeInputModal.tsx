import { Modal } from "../../Common/Modal"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import Form, { FormInstance } from "antd/es/form"
import { TimeClock } from "@mui/x-date-pickers/TimeClock"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import TimePicker from "antd/es/time-picker"

type TimeView = "hours" | "minutes"

export enum TimeInputModalType {
    date = "date",
    time = "time",
    timeRange = "timeRange",
    text = "text",
}

interface TimeInputModalProps {
    name: string | string[]
    form: FormInstance
    onClose?: (value: Dayjs | null) => void
    placeholder?: string
}

//Notice, when name is an array, pass onClose as a function that takes the value and sets the form field value
const TimeInputModal = ({
    name,
    form,
    onClose,
    placeholder,
}: TimeInputModalProps) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState<Dayjs | null>(null)
    const [view, setView] = useState<TimeView>("hours")

    useEffect(() => {
        if (open) {
            const formValue = form.getFieldValue(name)
            setValue(formValue ? dayjs(formValue) : null)
        }
    }, [open, form, name])

    const handleClose = () => {
        setOpen(false)
        if (value) {
            form.setFieldValue(name, value)
        }
        setValue(null)
        setView("hours")
        if (onClose) {
            onClose(value)
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
                    <TimePicker
                        placeholder={placeholder || ""}
                        minuteStep={5}
                        format="HH:mm"
                        changeOnScroll
                        needConfirm={false}
                        inputReadOnly
                        open={false}
                        allowClear={false}
                        size="large"
                        className="form-input-large"
                        popupClassName="form-input-large"
                    />
                </Form.Item>
            </div>
            <Modal open={open} onCancel={handleClose}>
                <section className="time-clock-value">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimeClock
                            className="time-clock-value-clock"
                            value={value}
                            onChange={(newValue) => {
                                setValue(newValue)
                            }}
                            view={view}
                            onViewChange={(newView) =>
                                setView(newView as TimeView)
                            }
                            views={["hours", "minutes"]}
                            ampmInClock={false}
                            focusedView={view}
                            ampm={false}
                            minutesStep={5}
                        />
                    </LocalizationProvider>

                    <button
                        className="general-clear-btn "
                        onClick={() =>
                            setView(view === "hours" ? "minutes" : "hours")
                        }
                    >
                        {view === "minutes" ? "שעות" : "דקות"}
                    </button>
                </section>
            </Modal>
        </>
    )
}

export default TimeInputModal
