import { Drawer } from "antd"
import FullEventCard from "./FullEventCard"

import { CIEvent, UserBio } from "../../../util/interfaces"
import { Icon } from "../Other/Icon"
import { useEffect, useState } from "react"

interface EventDrawerProps {
    event: CIEvent | null
    viewableTeachers: UserBio[]
    anchorEl: any | null
    isSelectedCard: boolean
}

export default function FullEventCardDrawer({
    event,
    viewableTeachers,
    anchorEl,
    isSelectedCard,
}: EventDrawerProps) {
    if (!event) {
        return null
    }
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        setIsModalOpen(isSelectedCard)
    }, [isSelectedCard])

    return (
        <>
            <div onClick={() => setIsModalOpen(true)}>{anchorEl}</div>

            <Drawer
                className="event-drawer"
                onClose={() => setIsModalOpen(false)}
                open={isModalOpen}
                closeIcon={
                    <Icon icon="chevron_right" className="event-drawer-close" />
                }
            >
                <FullEventCard
                    event={event}
                    viewableTeachers={viewableTeachers}
                />
            </Drawer>
        </>
    )
}
