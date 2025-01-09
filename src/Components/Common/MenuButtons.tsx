import { Icon } from "./Icon"
import { useState } from "react"
import '../../styles/menu-buttons.scss'
interface MenuButtonsProps {
    options: {
        key: string
        title?: string
        icon?: string
        ariaLabel?: string
    }[]
    defaultKey: string
    size?: "small" | "medium" | "large"
    btnClassName?: string
    onSelectKey: (key: string) => void
    direction?: "ltr" | "rtl"
}

export default function MenuButtons({
    options,
    defaultKey,
    size = "medium",
    btnClassName,
    onSelectKey,
    direction = "ltr",
}: MenuButtonsProps) {
    const [selectedBtn, setSelectedBtn] = useState<string>(defaultKey)
    return (
        <div className={`menu-btns ${direction}`}>
            {options.map((option, index) => (
                <button
                    key={option.key}
                    onClick={() => {
                        setSelectedBtn(option.key)
                        onSelectKey?.(option.key)
                    }}
                    className={`btn ${index === 0 && "left"} ${
                        index === options.length - 1 && "right"
                    } ${size} ${
                        selectedBtn === option.key ? "active" : ""
                    } ${btnClassName}`}
                    aria-label={option.ariaLabel}
                >
                    {option.title && (
                        <label className="label">{option.title}</label>
                    )}
                    {option.icon && (
                        <Icon icon={option.icon} className="menu-btn-icon" />
                    )}
                </button>
            ))}
        </div>
    )
}
