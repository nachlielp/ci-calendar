import { useState } from "react"
import { Modal } from "antd"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"

export default function AddEventModal({
    anchorEl,
    eventType,
    isTemplate,
}: {
    anchorEl: any
    eventType: string
    isTemplate?: boolean
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleOk = () => {
        setIsModalOpen(false)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <div onClick={showModal}>{anchorEl}</div>
            <Modal
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={null}
            >
                {eventType === "single-day" ? (
                    <SingleDayEventForm
                        closeForm={handleCancel}
                        isTemplate={isTemplate}
                    />
                ) : (
                    <MultiDayEventForm />
                )}
            </Modal>
        </>
    )
}
