import Drawer from "antd/es/drawer"
import FullEventCard from "./FullEventCard"

import { CIEvent } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "../../Common/Icon"
import { alertsService } from "../../../supabase/alertsService"
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

    useEffect(() => {
        if (isModalOpen && store.getAlerts) {
            const matchingAlert = store.getAlerts
                .filter((a) => !a.viewed)
                .find((alert) => {
                    return alert.ci_event_id === event.id
                })

            const setAlertViewed = async () => {
                if (matchingAlert) {
                    await alertsService.setAlertViewed(matchingAlert.id)
                }
            }
            setAlertViewed()
        }
    }, [isModalOpen, event.id, store.getAlerts])

    const onClose = () => {
        setIsModalOpen(false)
        navigate("/")
    }
    return (
        <>
            <div onClick={() => setIsModalOpen(true)}>{anchorEl}</div>

            <Drawer
                className="event-drawer"
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
