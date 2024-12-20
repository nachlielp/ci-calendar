import { useState } from "react"
// import Modal from "antd/es/modal"
import { Modal } from "../../Common/Modal"
import { CIEvent, CITemplate } from "../../../util/interfaces"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import EditMultiDayEventForm from "./EditMultiDayEventForm"

export default function FormModal({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const showModal = () => {
        setIsModalOpen(true)
    }

    const onClose = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <div onClick={showModal}>{anchorEl}</div>
            <Modal
                open={isModalOpen}
                // onOk={handleOk}
                onCancel={onClose}
                // footer={null}
                closable={false}
            >
                <button onClick={onClose}>Close</button>
                <div
                    className="modal-content"
                    style={{
                        width: "500px",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}
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
                            isTemplate={isTemplate}
                            event={event}
                            template={template}
                            closeForm={onClose}
                        />
                    )}
                    {eventType === "edit-multi-day" && (
                        <EditMultiDayEventForm
                            isTemplate={isTemplate}
                            event={event}
                            template={template}
                            closeForm={onClose}
                        />
                    )}
                </div>
            </Modal>
        </>
    )
}
