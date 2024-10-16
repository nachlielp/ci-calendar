import { useState } from "react"
import Modal from "antd/es/modal"
import { CIEvent, UserBio } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"

interface EventCardProps {
    event: CIEvent
    viewableTeachers: UserBio[]
    anchorEl: any | null
    isSelectedEvent?: boolean
}

export default function FullEventCardModal({
    event,
    anchorEl,
    viewableTeachers,
    isSelectedEvent = false,
}: EventCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(isSelectedEvent)

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
    }

    return (
        <>
            <div
                id={event.id}
                className="modal-card-header"
                onClick={showModal}
            >
                {anchorEl}
            </div>

            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                className="single-day-modal-card"
            >
                <FullEventCard
                    event={event}
                    viewableTeachers={viewableTeachers}
                />
            </Modal>
        </>
    )
}
