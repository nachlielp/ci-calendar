import { Button } from "antd"
import { Icon } from "./Icon"
import { useState } from "react"

interface MenuButtonsProps {
    options: {
        key: string
        title?: string
        icon?: string
    }[]
    defaultKey: string
    size?: "small" | "medium" | "large"
    btnClassName?: string
    onSelectKey: (key: string) => void
}

export default function MenuButtons({
    options,
    defaultKey,
    size = "medium",
    btnClassName,
    onSelectKey,
}: MenuButtonsProps) {
    const [selectedBtn, setSelectedBtn] = useState<string>(defaultKey)
    return (
        <div className="menu-btns">
            {options.map((option, index) => (
                <Button
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
                >
                    {option.title && (
                        <label className="label">{option.title}</label>
                    )}
                    {option.icon && (
                        <Icon icon={option.icon} className="menu-btn-icon" />
                    )}
                </Button>
            ))}
        </div>
    )
}
