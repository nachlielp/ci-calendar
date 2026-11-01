import { lazy, Suspense, useState } from "react"
import { useLocation } from "react-router"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { CloseIcon } from "../../ui/icons/CloseIcon"
import { TouchAppIcon } from "../../ui/icons/TouchAppIcon"
import type { DeviceStorage } from "../deviceStorage"
import { useCopy } from "../language"
import { useServices } from "../services"
import { PHONE_QUERY, useMediaQuery } from "../useMediaQuery"
import { isStandalone } from "../device"
import { useInstallPrompt } from "./installPrompt"
import "./InstallBanner.scss"

const InstallInstructions = lazy(() => import("./InstallInstructions"))

/**
 * Remembers that the visitor closed the banner. Legacy had no way to close
 * it (so no key to carry over); this key is new.
 */
export const INSTALL_BANNER_DISMISSED_KEY = "installBannerDismissed"

const COPY = defineCopy({
    he: {
        install: "לקבלת עדכונים הוסיפו לעמוד הבית",
        dismiss: "לא תודה",
    },
    en: {
        install: "For updates, add to Home Screen",
        dismiss: "No thanks",
    },
    ru: {
        install: "Для получения обновлений добавьте на главный экран",
        dismiss: "Нет, спасибо",
    },
})

/**
 * The purple "add to Home Screen" bar above the header (legacy
 * InstallPWABanner): on phones, on the calendar, outside the installed app.
 * A tap shows the browser's own install dialog when it offered one
 * (`beforeinstallprompt`, Chromium), else the iOS or Android steps. Closing
 * it hides it for good on this device.
 */
export function InstallBanner() {
    const { storage } = useServices()
    const copy = useCopy(COPY)
    const { pathname } = useLocation()
    const isPhone = useMediaQuery(PHONE_QUERY)
    const { installed, promptInstall } = useInstallPrompt()
    const [dismissed, setDismissed] = useState(() => readDismissed(storage))
    const [instructionsOpen, setInstructionsOpen] = useState(false)

    if (pathname !== "/" || !isPhone || installed || dismissed) return null
    if (isStandalone()) return null

    const install = async () => {
        if (!(await promptInstall())) setInstructionsOpen(true)
    }
    const dismiss = () => {
        try {
            storage.setItem(INSTALL_BANNER_DISMISSED_KEY, "true")
        } catch {
            // Storage full or blocked: hidden until the page closes.
        }
        setDismissed(true)
    }

    return (
        <aside className="install-banner" aria-label={copy.install}>
            <button
                type="button"
                className="install-banner-button"
                onClick={install}
            >
                {copy.install}
                <TouchAppIcon className="install-banner-icon" />
            </button>
            <button
                type="button"
                className="install-banner-dismiss"
                aria-label={copy.dismiss}
                onClick={dismiss}
            >
                <CloseIcon className="install-banner-icon" />
            </button>
            {instructionsOpen && (
                <Suspense fallback={null}>
                    <InstallInstructions
                        onClose={() => setInstructionsOpen(false)}
                    />
                </Suspense>
            )}
        </aside>
    )
}

function readDismissed(storage: DeviceStorage) {
    try {
        return storage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "true"
    } catch {
        return false
    }
}
