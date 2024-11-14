import Drawer from "antd/es/drawer"
import FullEventCard from "./FullEventCard"

import { CIEvent } from "../../../util/interfaces"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "../../Common/Icon"

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
