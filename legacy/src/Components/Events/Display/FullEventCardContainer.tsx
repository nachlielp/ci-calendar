import { observer } from "mobx-react-lite"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    event: CIEvent
    isSelectedEvent?: boolean
    anchorEl?: React.ReactNode
}

const FullEventCardContainer = ({
    event,
    isSelectedEvent = false,
    anchorEl,
}: FullEventCardContainerProps) => {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FullEventCardDrawer
            event={event}
            isSelectedEvent={isSelectedEvent}
            anchorEl={anchorEl}
        />
    ) : (
        <FullEventCardModal
            event={event}
            isSelectedEvent={isSelectedEvent}
            anchorEl={anchorEl}
        />
    )
}

export default observer(FullEventCardContainer)
