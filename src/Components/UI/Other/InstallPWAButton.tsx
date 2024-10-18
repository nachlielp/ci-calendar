import { useState, useEffect } from "react"

export function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (evt: Event) => {
            evt.preventDefault()
            setDeferredPrompt(evt)
            setIsVisible(true)
        }

        if ("onbeforeinstallprompt" in window) {
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
                setIsVisible(false)
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
        <button
            id="install-button"
            style={{ display: isVisible ? "block" : "none" }}
            onClick={handleInstallClick}
        >
            Install App
        </button>
    )
}
