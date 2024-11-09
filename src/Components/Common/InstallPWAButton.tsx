// import { useState, useEffect } from "react"

import { useState } from "react"
import { utilService } from "../../util/utilService"
import Modal from "antd/es/modal"
import ios_share from "../../assets/svgs/ios_share.svg"
import more_vert from "../../assets/svgs/more_vert.svg"
import add_to_home_screen from "../../assets/svgs/add_to_home_screen.svg"
import add_box from "../../assets/svgs/add_box.svg"
import { ReactSVG } from "react-svg"

export function InstallPWAButton() {
    // const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // useEffect(() => {
    //     const handleBeforeInstallPrompt = (evt: Event) => {
    //         console.log("handleBeforeInstallPrompt.evt", evt)
    //         evt.preventDefault()
    //         setDeferredPrompt(evt)
    //     }

    //     if ("onbeforeinstallprompt" in window) {
    //         console.log("onbeforeinstallprompt in window")
    //         window.addEventListener(
    //             "beforeinstallprompt",
    //             handleBeforeInstallPrompt
    //         )
    //     }

    //     return () => {
    //         window.removeEventListener(
    //             "beforeinstallprompt",
    //             handleBeforeInstallPrompt
    //         )
    //     }
    // }, [])

    const handleInstallClick = async () => {
        setIsOpen(true)
        return
        if (utilService.isIos()) {
        }
        // if (deferredPrompt) {
        //     const promptEvent = deferredPrompt as any // TypeScript workaround
        //     try {
        //         await promptEvent.prompt()
        //         const choiceResult = await promptEvent.userChoice
        //         console.log(
        //             `User response to the install prompt: ${choiceResult.outcome}`
        //         )
        //         if (choiceResult.outcome === "accepted") {
        //             console.log("User accepted the install prompt")
        //         } else {
        //             console.log("User dismissed the install prompt")
        //         }
        //         setDeferredPrompt(null)
        //     } catch (err: any) {
        //         if (err.message.includes("user gesture")) {
        //             console.log("Prompt failed due to lack of user gesture")
        //         } else if (
        //             err.message.includes("The app is already installed")
        //         ) {
        //             console.log("The app is already installed")
        //         } else {
        //             console.error("Prompt error:", err)
        //         }
        //     }
        // }
    }

    const iosContent = (
        <div className="install-pwa-modal-container">
            <h2 className="install-pwa-modal-title">התקנה באייפון</h2>
            <ol>
                <li className="install-pwa-modal-li">
                    1. פיתחו את האתר ב- Safari
                </li>
                <li className="install-pwa-modal-li">
                    2. לחצו על
                    <label className="install-share-icon-wrapper">
                        <ReactSVG src={ios_share} className="ios-share-icon" />
                    </label>
                    בסרגל הכרטיסיות
                </li>
                <li className="install-pwa-modal-li">
                    3. גללו מטה ובחרו ב
                    <label className="install-pwa-action-text ">
                        הוספה למסך הבית
                        <ReactSVG
                            src={add_box}
                            className="add-to-home-screen-icon"
                        />
                    </label>
                </li>
            </ol>
        </div>
    )

    const androidContent = (
        <div className="install-pwa-modal-container">
            <h2 className="install-pwa-modal-title">התקנה באנדרויד</h2>
            <ol>
                <li className="install-pwa-modal-li">
                    1. פיתחו את האתר ב- Chrome
                </li>
                <li className="install-pwa-modal-li">
                    2. לחצו על
                    <label className="install-share-icon-wrapper">
                        <ReactSVG src={more_vert} className="ios-share-icon" />
                    </label>
                    בסרגל כלים
                </li>
                <li className="install-pwa-modal-li">
                    3. גללו מטה ובחרו ב
                    <label className="install-pwa-action-text ">
                        <ReactSVG
                            src={add_to_home_screen}
                            className="add-to-home-screen-icon"
                        />
                        הוספה למסך הבית
                    </label>
                </li>
            </ol>
        </div>
    )
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
                {utilService.isIos() ? iosContent : androidContent}
            </Modal>
        </section>
    )
}
