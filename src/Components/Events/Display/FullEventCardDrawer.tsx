import Drawer from "antd/es/drawer"
import FullEventCard from "./FullEventCard"
import "../../../styles/full-event-card-drawer.scss"
import { CIEvent } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"
import { observer } from "mobx-react-lite"

interface EventDrawerProps {
    event: CIEvent | null
    anchorEl: any | null
    isSelectedEvent?: boolean
}

const FullEventCardDrawer = ({
    event,
    anchorEl,
    isSelectedEvent = false,
}: EventDrawerProps) => {
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

    const onOpen = () => {
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
            <div onClick={onOpen}>{anchorEl}</div>

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

export default observer(FullEventCardDrawer)
