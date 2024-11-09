import { useState } from "react"
import { Icon } from "../Common/Icon"

interface CopyButtonProps {
    label: string
    successLabel: string
    callback: () => void
    icon: string
    successIcon: string
    disabled?: boolean
    className?: string
}

export default function SecondaryButton({
    label = "",
    successLabel = "",
    callback,
    icon,
    successIcon,
    disabled,
    className,
}: CopyButtonProps) {
    const [isAction, setIsAction] = useState(false)

    const handleAction = () => {
        setIsAction(true)
        callback()
        setTimeout(() => setIsAction(false), 2000)
    }

    return (
        <>
            <button
                onClick={handleAction}
                className={`secondary-action-btn ${className}`}
                disabled={disabled}
            >
                {isAction ? (
                    <>
                        <label className="label">{successLabel}</label>
                        <Icon icon={successIcon} />
                    </>
                ) : (
                    <>
                        <label className="label">{label}</label>
                        <Icon icon={icon} />
                    </>
                )}
            </button>
        </>
    )
}
