import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent, UserBio } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    viewableTeachers: UserBio[]
    event: CIEvent
    anchorEl: any | null
    isSelectedEvent?: boolean
}

export default function FullEventCardContainer({
    event,
    viewableTeachers,
    anchorEl,
    isSelectedEvent = false,
}: FullEventCardContainerProps) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FullEventCardDrawer
            event={event}
            viewableTeachers={viewableTeachers}
            anchorEl={anchorEl}
            isSelectedEvent={isSelectedEvent}
        />
    ) : (
        <FullEventCardModal
            event={event}
            viewableTeachers={viewableTeachers}
            anchorEl={anchorEl}
            isSelectedEvent={isSelectedEvent}
        />
    )
}
