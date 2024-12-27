import { observer } from "mobx-react-lite"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    event: CIEvent
    anchorEl: any | null
    isSelectedEvent?: boolean
}

const FullEventCardContainer = ({
    event,
    anchorEl,
    isSelectedEvent = false,
}: FullEventCardContainerProps) => {
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

export default observer(FullEventCardContainer)
