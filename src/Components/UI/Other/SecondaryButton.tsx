import { useState } from "react"
import { Icon } from "./Icon"

interface CopyButtonProps {
    label: string
    successLabel: string
    callback: () => void
    icon: string
    successIcon: string
}

export default function SecondaryButton({
    label = "",
    successLabel = "",
    callback,
    icon,
    successIcon,
}: CopyButtonProps) {
    const [isAction, setIsAction] = useState(false)

    const handleAction = () => {
        setIsAction(true)
        callback()
        setTimeout(() => setIsAction(false), 2000)
    }

    return (
        <>
            <button onClick={handleAction} className="secondary-action-btn">
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
