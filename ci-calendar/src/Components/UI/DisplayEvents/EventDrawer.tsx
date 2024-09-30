import { Drawer } from "antd"
import FullEventCard from "./FullEventCard"

import { CIEvent, UserBio } from "../../../util/interfaces"
import { Icon } from "../Other/Icon"

interface EventDrawerProps {
    event: CIEvent | null
    onClose: () => void
    viewableTeachers: UserBio[]
}

export default function EventDrawer({
    event,
    onClose,
    viewableTeachers,
}: EventDrawerProps) {
    if (!event) {
        return null
    }
    return (
        <Drawer
            className="event-drawer"
            onClose={onClose}
            open={!!event}
            closeIcon={
                <Icon icon="chevron_right" className="event-drawer-close" />
            }
        >
            <FullEventCard event={event} viewableTeachers={viewableTeachers} />
        </Drawer>
    )
}
