// import { useState, useEffect } from "react"

import { useEffect, useState } from "react"
import { utilService } from "../../../util/utilService"
import Modal from "antd/es/modal"

export function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (evt: Event) => {
            console.log("handleBeforeInstallPrompt.evt", evt)
            evt.preventDefault()
            setDeferredPrompt(evt)
        }

        if ("onbeforeinstallprompt" in window) {
            console.log("onbeforeinstallprompt in window")
            window.addEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            )
        }

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            )
        }
    }, [])

    const handleInstallClick = async () => {
        if (true) {
            setIsOpen(true)
            return
        }
        if (deferredPrompt) {
            const promptEvent = deferredPrompt as any // TypeScript workaround
            try {
                await promptEvent.prompt()
                const choiceResult = await promptEvent.userChoice
                console.log(
                    `User response to the install prompt: ${choiceResult.outcome}`
                )
                if (choiceResult.outcome === "accepted") {
                    console.log("User accepted the install prompt")
                } else {
                    console.log("User dismissed the install prompt")
                }
                setDeferredPrompt(null)
            } catch (err: any) {
                if (err.message.includes("user gesture")) {
                    console.log("Prompt failed due to lack of user gesture")
                } else if (
                    err.message.includes("The app is already installed")
                ) {
                    console.log("The app is already installed")
                } else {
                    console.error("Prompt error:", err)
                }
            }
        }
    }

    return (
        <>
            <button
                id="install-button"
                className="install-pwa-btn"
                style={{ display: !utilService.isPWA() ? "block" : "none" }}
                onClick={handleInstallClick}
            >
                התקנה
            </button>
            <Modal
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                footer={null}
            >
                <div>
                    <h2>{navigator.userAgent}</h2>
                </div>
            </Modal>
        </>
    )
}
