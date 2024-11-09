import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    event: CIEvent
    anchorEl: any | null
    isSelectedEvent?: boolean
}

export default function FullEventCardContainer({
    event,
    anchorEl,
    isSelectedEvent = false,
}: FullEventCardContainerProps) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FullEventCardDrawer
            event={event}
            anchorEl={anchorEl}
            isSelectedEvent={isSelectedEvent}
        />
    ) : (
        <FullEventCardModal
            event={event}
            anchorEl={anchorEl}
            isSelectedEvent={isSelectedEvent}
        />
    )
}
