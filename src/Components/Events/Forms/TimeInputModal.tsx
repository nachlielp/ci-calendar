import Modal from "antd/es/modal"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import Form, { FormInstance } from "antd/es/form"
import { TimeClock } from "@mui/x-date-pickers/TimeClock"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import TimePicker from "antd/es/time-picker"

type TimeView = "hours" | "minutes"

export enum FormInputModalType {
    date = "date",
    time = "time",
    timeRange = "timeRange",
    text = "text",
}

interface FormInputModalProps {
    onClose: (value: Dayjs | null) => void
    name: string
    form: FormInstance
}

const FormInputModal = ({ onClose, name, form }: FormInputModalProps) => {
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
        onClose(value)
        if (value) {
            form.setFieldValue(name, value)
        }
        setValue(null)
        setView("hours")
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
            </div>
            <Modal open={open} onCancel={handleClose} footer={null}>
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

export default FormInputModal
