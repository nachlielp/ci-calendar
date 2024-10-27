import { useState } from "react"
import Modal from "antd/es/modal"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import { EventAction } from "../../../App"
import EditMultiDayEventForm from "./EditMultiDayEventForm"
import { CIEvent, CITemplate } from "../../../util/interfaces"
import { DBCIEvent } from "../../../supabase/cieventsService"

export default function FormModal({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
    updateEventState,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
    updateEventState?: (eventId: string, event: DBCIEvent) => void
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
                {eventType === "edit-single-day" && (
                    <EditSingleDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                        updateEventState={updateEventState!}
                    />
                )}
                {eventType === "edit-multi-day" && (
                    <EditMultiDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                        updateEventState={updateEventState!}
                    />
                )}
            </Modal>
        </>
    )
}
