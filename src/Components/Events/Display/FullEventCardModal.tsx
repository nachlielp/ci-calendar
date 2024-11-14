import { useState, useEffect } from "react"
import Modal from "antd/es/modal"
import { CIEvent } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"
import { useNavigate } from "react-router-dom"
import { useUser } from "../../../context/UserContext"
import { alertsService } from "../../../supabase/alertsService"

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

    const { user } = useUser()

    useEffect(() => {
        if (isModalOpen && user?.alerts) {
            const matchingAlert = user.alerts.find(
                (alert) => alert.ci_event_id === event.id
            )
            if (matchingAlert && !matchingAlert.viewed) {
                alertsService.setAlertViewed(matchingAlert.id)
            }
        }
    }, [isModalOpen, event.id, user?.alerts])

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
