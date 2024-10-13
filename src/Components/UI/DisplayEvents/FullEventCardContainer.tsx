import { useWindowSize } from "../../../hooks/useWindowSize"
import { CIEvent, UserBio } from "../../../util/interfaces"
import { ScreenSize } from "../../../util/options"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    viewableTeachers: UserBio[]
    event: CIEvent
    onSelectEvent: (event: CIEvent) => void
    anchorEl: any | null
    selectedEventId: string | null
}

export default function FullEventCardContainer({
    event,
    viewableTeachers,
    onSelectEvent,
    anchorEl,
    selectedEventId,
}: FullEventCardContainerProps) {
    const { width } = useWindowSize()
    const isMobile = width < ScreenSize.mobile
    return isMobile ? (
        <FullEventCardDrawer
            event={event}
            viewableTeachers={viewableTeachers}
            anchorEl={anchorEl}
            isSelectedCard={selectedEventId === event.id}
        />
    ) : (
        <FullEventCardModal
            event={event}
            viewableTeachers={viewableTeachers}
            onSelectEvent={onSelectEvent}
            anchorEl={anchorEl}
            isSelectedCard={selectedEventId === event.id}
        />
    )
}
