import React, { useState } from "react"
import { Modal } from "./Modal"
import "../../styles/confirm.css"
import { createRoot } from "react-dom/client"

interface ConfirmProps {
    title: React.ReactNode
    icon?: React.ReactNode
    content: React.ReactNode
    okText?: string
    cancelText?: string
    okType?: "danger" | "primary"
    onOk?: () => Promise<void> | void
    onCancel?: () => void
    direction?: "rtl" | "ltr"
}

export const Confirm = ({
    title,
    icon,
    content,
    okText = "אישור",
    cancelText = "חזרה",
    okType = "primary",
    onOk,
    onCancel,
    direction = "ltr",
}: ConfirmProps) => {
    const [isOpen, setIsOpen] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    const handleOk = async () => {
        try {
            setIsLoading(true)
            await onOk?.()
            setIsOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        onCancel?.()
        setIsOpen(false)
    }

    return (
        <Modal open={isOpen} onCancel={handleCancel}>
            <div className={`confirm-container ${direction}`}>
                <div className="confirm-header">
                    {icon && <span className="confirm-icon">{icon}</span>}
                    <span className="confirm-title">{title}</span>
                </div>
                <div className="confirm-content">{content}</div>
                <div className="confirm-footer">
                    <button
                        className={`confirm-btn ${okType}`}
                        onClick={handleOk}
                        disabled={isLoading}
                    >
                        {okText}
                    </button>
                    <button
                        className="confirm-btn cancel"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export const confirm = (config: ConfirmProps) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
        root.unmount()
        if (container.parentNode) {
            container.parentNode.removeChild(container)
        }
    }

    root.render(
        <Confirm
            {...config}
            onOk={async () => {
                await config.onOk?.()
                cleanup()
            }}
            onCancel={() => {
                config.onCancel?.()
                cleanup()
            }}
        />
    )
}
