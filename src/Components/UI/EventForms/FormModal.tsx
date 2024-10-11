import { useState } from "react"
import { Modal } from "antd"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import { EventAction } from "../../../App"
import EditMultiDayEventForm from "./EditMultiDayEventForm"

export default function FormModal({
    anchorEl,
    eventType,
    isTemplate,
    itemId,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    itemId?: string
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleOk = () => {
        setIsModalOpen(false)
    }

    const onClose = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <div onClick={showModal}>{anchorEl}</div>
            <Modal
                open={isModalOpen}
                onOk={handleOk}
                onCancel={onClose}
                footer={null}
            >
                {eventType === "create-single-day" && (
                    <SingleDayEventForm
                        closeForm={onClose}
                        isTemplate={isTemplate}
                    />
                )}
                {eventType === "create-multi-day" && (
                    <MultiDayEventForm
                        closeForm={onClose}
                        isTemplate={isTemplate}
                    />
                )}
                {eventType === "edit-single-day" && itemId && (
                    <EditSingleDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        itemId={itemId}
                        closeForm={onClose}
                    />
                )}
                {eventType === "edit-multi-day" && itemId && (
                    <EditMultiDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        itemId={itemId}
                        closeForm={onClose}
                    />
                )}
            </Modal>
        </>
    )
}
