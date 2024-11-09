import { cieventsService } from "../../../supabase/cieventsService"
import { Icon } from "../../Common/Icon"

export default function UnHideMultipleEventsButton({
    eventIds,
    className,
    disabled,
}: {
    eventIds: string[]
    className?: string
    disabled?: boolean
}) {
    const handleHide = () => {
        cieventsService.updateMultipleCIEvents(eventIds, { hide: false })
    }
    return (
        <button
            className={`${className}`}
            onClick={handleHide}
            disabled={disabled}
        >
            <Icon icon="visibility" />
        </button>
    )
}
