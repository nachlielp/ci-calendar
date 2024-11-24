import Modal from "antd/es/modal"
import { useEffect, useState } from "react"
import TimeClockValue from "./TimeClockValue"
import dayjs, { Dayjs } from "dayjs"
import { FormInstance } from "antd/es/form"

export enum FormInputModalType {
    date = "date",
    time = "time",
    timeRange = "timeRange",
    text = "text",
}

interface FormInputModalProps {
    type: FormInputModalType
    onClose: (value: Dayjs | null) => void
    anchorEl: React.ReactNode
    name: string
    form: FormInstance
}

const FormInputModal = ({
    type,
    onClose,
    anchorEl,
    name,
    form,
}: FormInputModalProps) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState<Dayjs | null>(null)

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
    }
    return (
        <>
            <div onClick={() => setOpen(true)}>{anchorEl}</div>
            <Modal open={open} onCancel={handleClose} footer={null}>
                {type === FormInputModalType.time && (
                    <TimeClockValue value={value} setValue={setValue} />
                )}

                {/* {type === FormInputModalType.date && (
                    <Form.Item name={name}>
                        <DatePicker />
                    </Form.Item>
                )} */}

                {/* {type === FormInputModalType.timeRange && (
                    <Form.Item name={name}>
                        <TimePicker.RangePicker />
                    </Form.Item>
                )} */}

                {/* {type === FormInputModalType.text && (
                    <Form.Item name={name}>
                        <Input />
                    </Form.Item>
                )} */}
            </Modal>
        </>
    )
}

export default FormInputModal
