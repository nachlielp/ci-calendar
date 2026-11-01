import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useCopy } from "../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { ChevronRightIcon } from "./icons/ChevronRightIcon"
import { CloseIcon } from "./icons/CloseIcon"
import "./Dialog.scss"

/**
 * A modal on a native `<dialog>`: a full-screen drawer on phones, a centred
 * modal on wider screens (CSS only, as legacy switched at 500px). It opens
 * when mounted, so render it only while it should show. It renders into
 * `document.body`, so it can be opened from anywhere (even inside a `<p>`),
 * though React events still bubble through its owner.
 *
 * The close button, Escape and a click on the backdrop close the native
 * dialog, and its `close` event calls `onClose`; the owner then unmounts it
 * (e.g. by navigating away). Unmounting it any other way (e.g. the browser's
 * Back) is fine too. Either way focus returns to where it was before.
 */
export function Dialog({
    label,
    onClose,
    className = "",
    children,
}: {
    /** The accessible name of the dialog. */
    label: string
    onClose: () => void
    className?: string
    children: ReactNode
}) {
    const common = useCopy(COMMON_COPY)
    const ref = useRef<HTMLDialogElement>(null)
    // A click closes the dialog only if it also started on the backdrop, so
    // a text selection or drag released outside the box doesn't.
    const pressedBackdrop = useRef(false)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog || dialog.open) return
        const opener = document.activeElement
        dialog.showModal()
        // Focus the dialog itself, as a drawer or modal does, rather than
        // its first button (the close button, ringed on open).
        dialog.focus()
        return () => {
            if (opener instanceof HTMLElement && opener.isConnected) {
                opener.focus()
            }
        }
    }, [])

    const requestClose = () => ref.current?.close()

    return createPortal(
        // The body fills the dialog box, so only backdrop clicks land on the
        // dialog element itself. The keyboard equivalent is Escape, built in.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <dialog
            ref={ref}
            aria-label={label}
            tabIndex={-1}
            className={`dialog ${className}`}
            // A nested dialog's close event bubbles here through React.
            onClose={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            onPointerDown={(e) => {
                pressedBackdrop.current = e.target === e.currentTarget
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && pressedBackdrop.current) {
                    requestClose()
                }
            }}
        >
            <div className="dialog-body">
                <button
                    type="button"
                    className="dialog-close"
                    aria-label={common.close}
                    onClick={requestClose}
                >
                    <ChevronRightIcon className="dialog-close-drawer" />
                    <CloseIcon className="dialog-close-modal" />
                </button>
                {children}
            </div>
        </dialog>,
        document.body,
    )
}
