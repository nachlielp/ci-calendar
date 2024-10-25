// import { useState, useEffect } from "react"

import { useEffect, useState } from "react"
import { utilService } from "../../../util/utilService"
import Modal from "antd/es/modal"
import ios_share from "../../../assets/svgs/ios_share.svg"
import { ReactSVG } from "react-svg"

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
        if (utilService.isIos()) {
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
        <section className="install-pwa-button">
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
                <div className="install-pwa-modal-container">
                    <h2 className="install-pwa-modal-title">התקנה באייפון</h2>
                    <ol>
                        <li className="install-pwa-modal-li">
                            1. פיתחו את האתר ב- Safari
                        </li>
                        <li className="install-pwa-modal-li">
                            2. לחצו על
                            <label className="install-share-icon-wrapper">
                                <ReactSVG
                                    src={ios_share}
                                    className="ios-share-icon"
                                />
                            </label>
                            בסרגל הכרטיסיות
                        </li>
                        <li className="install-pwa-modal-li">
                            3. גללו מטה ובחרו ב
                            <label className="install-pwa-action-text ">
                                הוספה למסך הבית
                            </label>
                        </li>
                    </ol>
                </div>
            </Modal>
        </section>
    )
}
