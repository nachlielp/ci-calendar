import { defineCopy } from "../lib/copy"
import { SettingsIcon } from "../ui/icons/SettingsIcon"
import { useCopy } from "./language"

// Pure, so a build without the switch (`RootLayout`'s check folded to false)
// drops this whole module from `/`.
const COPY = /* @__PURE__ */ defineCopy({
    he: {
        title: "קונטקט אימפרוביזציה ישראל",
        closed: "סגור לרגל שיפוצים",
    },
    en: {
        title: "Contact Improvisation Israel",
        closed: "Closed for maintenance",
    },
    ru: {
        title: "Контактная импровизация Израиль",
        closed: "Закрыто на техническое обслуживание",
    },
})

/**
 * Legacy's DisableAppNotice: the app is closed for maintenance. A build with
 * `VITE_DISABLE_APP=true` shows it on every path instead of the app
 * (`RootLayout`); the next deploy without it brings the app back, installed
 * apps included (the service worker and updates still run).
 */
export function AppDisabled() {
    const copy = useCopy(COPY)
    return (
        <main className="app-disabled">
            <SettingsIcon className="app-disabled-icon" />
            <h1 className="app-disabled-title">{copy.title}</h1>
            <p className="app-disabled-subtitle">{copy.closed}</p>
        </main>
    )
}
