import { useState, useEffect } from "react"

export function InstallPWAButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        )

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
            promptEvent.prompt()
            const { outcome } = await promptEvent.userChoice
            console.log(`User response to the install prompt: ${outcome}`)
            setDeferredPrompt(null)
            setIsVisible(false)
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
