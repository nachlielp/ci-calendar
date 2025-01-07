import { useState, useEffect } from "react"
// import { Modal } from "../../Common/Modal"
import { CIEvent } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"
import { useNavigate } from "react-router"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"
import Modal from "antd/es/modal/Modal"

interface EventCardProps {
    event: CIEvent
    anchorEl: any | null
    isSelectedEvent?: boolean
}

const FullEventCardModal = ({
    event,
    anchorEl,
    isSelectedEvent = false,
}: EventCardProps) => {
    const navigate = useNavigate()

    const [isModalOpen, setIsModalOpen] = useState(isSelectedEvent)

    useEffect(() => {
        if (isModalOpen && store.isUser && event.id) {
            store.viewEventAlert(event.id)
        }
    }, [isModalOpen])

    const showModal = () => {
        navigate(`/event/${event.id}`)
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

            <Modal
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                style={{
                    top: "20px", // Set specific top margin
                }}
            >
                <div style={{ width: "500px" }}>
                    <FullEventCard event={event} />
                </div>
            </Modal>
        </>
    )
}

export default observer(FullEventCardModal)
