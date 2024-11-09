import { Modal } from "antd"
import { useState } from "react"
import TextArea from "antd/es/input/TextArea"

export default function AddResponseToSupportReqModal({
    onSubmit,
}: {
    onSubmit: (response: string) => void
}) {
    const [open, setOpen] = useState<boolean>(false)
    const [response, setResponse] = useState<string>("")

    const handleSubmit = () => {
        const currentResponse = response
        setResponse("")
        onSubmit(currentResponse)
        setOpen(false)
    }

    return (
        <>
            <button
                className="secondary-action-btn low-margin"
                onClick={() => setOpen(true)}
            >
                הוספת תשובה
            </button>
            <Modal
                open={open}
                title="הוספת תשובה לבקשת תמיכה"
                onOk={handleSubmit}
                onCancel={() => setOpen(false)}
                okText="שלח"
                cancelText="ביטול"
            >
                <TextArea
                    rows={4}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="הכנס תשובה כאן..."
                    value={response}
                />
            </Modal>
        </>
    )
}
