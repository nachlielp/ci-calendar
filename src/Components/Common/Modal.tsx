import React, { useEffect, useRef } from "react"
import "../../styles/modal.css"
interface ModalProps {
    children: React.ReactNode
    open?: boolean
    onCancel?: () => void
    className?: string
    closable?: boolean
}

export const Modal = ({
    children,
    open,
    onCancel,
    className = "",
    closable = true,
}: ModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (open) {
            dialog.showModal()
        } else {
            dialog.close()
        }
    }, [open])

    const handleClick = (e: React.MouseEvent) => {
        if (!closable) return
        // Check if click was on the backdrop (dialog element itself)
        const rect = dialogRef.current?.getBoundingClientRect()
        if (
            rect &&
            (e.clientY < rect.top ||
                e.clientY > rect.bottom ||
                e.clientX < rect.left ||
                e.clientX > rect.right)
        ) {
            onCancel?.()
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className={`modal ${className}`}
            onClick={handleClick}
        >
            {children}
        </dialog>
    )
}
