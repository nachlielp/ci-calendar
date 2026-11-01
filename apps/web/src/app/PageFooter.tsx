import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { useCopy } from "./language"
import { useServices } from "./services"
import "./PageFooter.scss"

const ResetAppDialog = lazy(() => import("./ResetAppDialog"))

const COPY = defineCopy({
    he: {
        association: "עמותת הקונטקט בישראל ©️",
        privacy: "מדיניות הפרטיות",
        terms: "תנאי השירות והגבלות",
        version: (version: string) => `איפוס האפליקציה (גרסה ${version})`,
    },
    en: {
        association: "Israeli Contact Improvisation Association ©️",
        privacy: "Privacy policy",
        terms: "Terms and conditions",
        version: (version: string) => `Reset the app (version ${version})`,
    },
    ru: {
        association: "Израильская ассоциация контактной импровизации ©️",
        privacy: "Политика конфиденциальности",
        terms: "Условия использования",
        version: (version: string) => `Сбросить приложение (версия ${version})`,
    },
})

/**
 * The footer under the calendar list and the static pages (legacy
 * PageFooter): the association, the build version and the legal pages. The
 * version doubles as legacy's "reset the app" button (`ResetAppDialog`).
 */
export function PageFooter() {
    const copy = useCopy(COPY)
    const { buildVersion } = useServices()
    const [confirming, setConfirming] = useState(false)

    return (
        <footer className="page-footer">
            <p className="footer-item">{copy.association}</p>
            <p className="footer-item">
                <button
                    type="button"
                    className="footer-version"
                    aria-label={copy.version(buildVersion)}
                    onClick={() => setConfirming(true)}
                >
                    v - {buildVersion}
                </button>
                {" | "}
                <Link to="/privacy-policy">{copy.privacy}</Link>
                {" | "}
                <Link to="/terms-and-conditions">{copy.terms}</Link>
            </p>
            {confirming && (
                <Suspense fallback={null}>
                    <ResetAppDialog onClose={() => setConfirming(false)} />
                </Suspense>
            )}
        </footer>
    )
}
