import { cieventsService } from "../../../supabase/cieventsService"
import { Icon } from "./Icon"

export default function HideMultipleEventsButton({
    eventIds,
    className,
    disabled,
}: {
    eventIds: string[]
    className?: string
    disabled?: boolean
}) {
    const handleHide = () => {
        cieventsService.updateMultipleCIEvents(eventIds, { hide: true })
    }
    return (
        <button
            className={`${className}`}
            onClick={handleHide}
            disabled={disabled}
        >
            <Icon icon="visibilityOff" />
        </button>
    )
}
