import { observer } from "mobx-react-lite"
import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    event: CIEvent
    isSelectedEvent?: boolean
}

const FullEventCardContainer = ({
    event,
    isSelectedEvent = false,
}: FullEventCardContainerProps) => {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FullEventCardDrawer event={event} isSelectedEvent={isSelectedEvent} />
    ) : (
        <FullEventCardModal event={event} isSelectedEvent={isSelectedEvent} />
    )
}

export default observer(FullEventCardContainer)
