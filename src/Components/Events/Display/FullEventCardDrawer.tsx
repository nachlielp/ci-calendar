import Drawer from "antd/es/drawer"
import FullEventCard from "./FullEventCard"
import "../../../styles/full-event-card-drawer.css"
import { CIEvent } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"

interface EventDrawerProps {
    event: CIEvent | null
    anchorEl: any | null
    isSelectedEvent?: boolean
}

export default function FullEventCardDrawer({
    event,
    anchorEl,
    isSelectedEvent = false,
}: EventDrawerProps) {
    const navigate = useNavigate()
    if (!event) {
        return null
    }
    const [isModalOpen, setIsModalOpen] = useState(isSelectedEvent)

    //TODO - handle seen when offline
    useEffect(() => {
        if (isModalOpen && store.isUser && store.isOnline) {
            store.viewEventAlert(event.id)
        }
    }, [isModalOpen, event.id, store.isUser, store.isOnline])

    const onClose = () => {
        setIsModalOpen(false)
        navigate("/")
    }
    return (
        <>
            <div onClick={() => setIsModalOpen(true)}>{anchorEl}</div>

            <Drawer
                className="full-event-card-drawer"
                onClose={onClose}
                open={isModalOpen}
                closeIcon={
                    <Icon icon="chevron_right" className="event-drawer-close" />
                }
            >
                <FullEventCard event={event} />
            </Drawer>
        </>
    )
}
