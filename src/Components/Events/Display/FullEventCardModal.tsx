import { useState, useEffect } from "react"
// import { Modal } from "../../Common/Modal"
import { CIEvent } from "../../../util/interfaces"
import FullEventCard from "./FullEventCard"
import { useNavigate } from "react-router"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"
import Modal from "antd/es/modal/Modal"
import EventPreview from "./EventPreview"

interface EventCardProps {
    event: CIEvent
    isSelectedEvent?: boolean
}

const FullEventCardModal = ({
    event,
    isSelectedEvent = false,
}: EventCardProps) => {
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(isSelectedEvent)
    const [isClicked, setIsClicked] = useState(false)

    useEffect(() => {
        if (isModalOpen && store.isUser && event.id) {
            store.viewEventAlert(event.id)
        }
    }, [isModalOpen])

    useEffect(() => {
        if (isClicked) {
            setIsClicked(false)
        }
    }, [store.isLoading])

    const onOpen = () => {
        if (store.isLoading) {
            setIsClicked(true)
            return
        }

        const currentPath = window.location.pathname
        const currentSearch = window.location.search

        // Only navigate if we're not already on this event's page
        if (!currentPath.includes(`/event/${event.short_id}`)) {
            navigate(`/event/${event.short_id}${currentSearch}`)
        } else {
            setIsModalOpen(true)
        }
    }

    const onClose = () => {
        setIsModalOpen(false)
        // const currentSearch = window.location.search
        // navigate(`/${currentSearch}`)
    }

    return (
        <>
            <div id={event.id} onClick={onOpen}>
                <EventPreview
                    key={event.id}
                    event={event}
                    isClicked={isClicked}
                />
            </div>

            <Modal
                open={isModalOpen}
                onCancel={onClose}
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
