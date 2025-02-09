import { Suspense, useState } from "react"
import { useNavigate } from "react-router"
import "./styles/overrides.scss"

import EventsPageSkeleton from "./Components/Events/Display/EventsPageSkeleton"
import AppHeader from "./Components/Layout/AppHeader"
import BackgroundTiles from "./Components/Layout/BackgroundTiles"
import { SpeedInsights } from "@vercel/speed-insights/react"

import { observer } from "mobx-react-lite"
import ErrorBoundary from "./Components/Common/ErrorBoundary"

import "./styles/app-disabled.scss"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { useRemoveAppLoadingScreen } from "./hooks/useRemoveAppLoadingScreen"
import { Icon } from "./Components/Common/Icon"
import PostHogPageView from "./Components/Common/PHPageView"
import { AppRoutes } from "./routes"

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault("Asia/Jerusalem")

export enum EventAction {
    edit,
    create,
    recycle,
}

export const CACHE_VERSION = "1.6.82"

export const EMAIL_SUPPORT = "info@ci-events.org"
export const PAYBOX_URL = "https://payboxapp.page.link/32yzdN1D1gix4AR37"
export const DATE_LIMIT = dayjs().add(1, "year").toDate()

const disableApp = import.meta.env.VITE_DISABLE_APP

const App = () => {
    const [isDev] = useState(
        localStorage.getItem("isInternal") === "true" ||
            import.meta.env.VITE_BRANCH !== "prod"
    )

    const navigate = useNavigate()
    useRemoveAppLoadingScreen()

    if (disableApp === "true") {
        return <DisableAppNotice />
    }

    return (
        <div className="app">
            {!isDev && <SpeedInsights />}
            <BackgroundTiles />
            <PostHogPageView />
            <div
                className="app-content"
                style={{ width: "100%", maxWidth: "500px" }}
            >
                <ErrorBoundary navigate={navigate}>
                    <Suspense fallback={<EventsPageSkeleton />}>
                        <AppHeader />
                        <AppRoutes />
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    )
}

export default observer(App)

const DisableAppNotice = () => {
    return (
        <div className="app">
            <BackgroundTiles />
            <div
                className="app-content"
                style={{ width: "100%", maxWidth: "500px" }}
            >
                <section className="app-disabled">
                    <span>
                        <Icon icon="settings" className="event-icon spinning" />
                    </span>
                    <h2 className="app-disabled-title">
                        קונטקט אימפרוביזציה ישראל
                    </h2>
                    <h3 className="app-disabled-subtitle">סגור לרגל שיפוצים</h3>
                </section>
            </div>
        </div>
    )
}
