import { useState, useEffect } from "react"
import Modal from "antd/es/modal"
import { CIEvent } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"
import { useNavigate } from "react-router-dom"
import { alertsService } from "../../../supabase/alertsService"
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
        if (isModalOpen && store.getAlerts) {
            const matchingAlert = store.getAlerts
                .filter((a) => !a.viewed)
                .find((alert) => {
                    return alert.ci_event_id === event.id
                })
            if (matchingAlert) {
                alertsService.setAlertViewed(matchingAlert.id)
            }
        }
    }, [isModalOpen, event.id, store.getAlerts])

    const showModal = () => {
        setIsModalOpen(true)
    }

    const handleCancel = () => {
        setIsModalOpen(false)
        navigate("/")
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
                <FullEventCard event={event} />
            </Modal>
        </>
    )
}
