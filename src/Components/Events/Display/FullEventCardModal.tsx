import { useState, useEffect } from "react"
import { Modal } from "../../Common/Modal"
import { CIEvent } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"
import { useNavigate } from "react-router-dom"
import { store } from "../../../Store/store"

interface EventCardProps {
    event: CIEvent
    anchorEl: any | null
    isSelectedEvent?: boolean
}

export default function FullEventCardModal({
    event,
    anchorEl,
    isSelectedEvent = false,
}: EventCardProps) {
    const navigate = useNavigate()

    const [isModalOpen, setIsModalOpen] = useState(isSelectedEvent)

    useEffect(() => {
        if (isModalOpen && store.isUser && event.id) {
            store.viewEventAlert(event.id)
        }
    }, [isModalOpen])

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
        navigate("/")
    }

    return (
        <>
            <div id={event.id} onClick={showModal}>
                {anchorEl}
            </div>

            <Modal open={isModalOpen} onCancel={handleCancel}>
                <div style={{ width: "500px" }}>
                    <FullEventCard event={event} />
                </div>
            </Modal>
        </>
    )
}
