import { useIsMobile } from "../../../hooks/useIsMobile"
import { CIEvent, UserBio } from "../../../util/interfaces"
import FullEventCardDrawer from "./FullEventCardDrawer"
import FullEventCardModal from "./FullEventCardModal"

interface FullEventCardContainerProps {
    viewableTeachers: UserBio[]
    event: CIEvent
    anchorEl: any | null
}

export default function FullEventCardContainer({
    event,
    viewableTeachers,
    anchorEl,
}: FullEventCardContainerProps) {
    const isMobile = useIsMobile()
    return isMobile ? (
        <FullEventCardDrawer
            event={event}
            viewableTeachers={viewableTeachers}
            anchorEl={anchorEl}
        />
    ) : (
        <FullEventCardModal
            event={event}
            viewableTeachers={viewableTeachers}
            anchorEl={anchorEl}
        />
    )
}
