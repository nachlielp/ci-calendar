import { Suspense, lazy } from "react"
import { Routes, Route, useNavigate } from "react-router"
import "./styles/overrides.css"

import EventsPage from "./Components/Pages/EventsPage"
import Loading from "./Components/Common/Loading"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import EventsPageSkeleton from "./Components/Events/Display/EventsPageSkeleton"
import AppHeader from "./Components/Layout/AppHeader"
import BackgroundTiles from "./Components/Layout/BackgroundTiles"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import SingleDayFormPage from "./Components/Pages/SingleDayFormPage"
import MultiDayFormPage from "./Components/Pages/MultiDayFormPage"

import { UserType } from "./util/interfaces"
import { SpeedInsights } from "@vercel/speed-insights/react"

import { observer } from "mobx-react-lite"
import ErrorBoundary from "./Components/Common/ErrorBoundary"
import { AboutPage } from "./Components/Pages/AboutPage"
import { PrivacyPolicyPage } from "./Components/Pages/PrivacyPolicyPage"
import { TCPage } from "./Components/Pages/TCPage"

const ResetPasswordRequest = lazy(
    () => import("./Components/Auth/ResetPasswordRequest")
)

const Login = lazy(() => import("./Components/Auth/Login"))
const Signup = lazy(() => import("./Components/Auth/Signup"))
const CreateEventsPage = lazy(
    () => import("./Components/Pages/CreateEventsPage")
)
const SupportPage = lazy(() => import("./Components/Pages/SupportPage"))
const ManageSupportPage = lazy(
    () => import("./Components/Pages/ManageSupportPage")
)
const NotificationsPage = lazy(
    () => import("./Components/Pages/NotificationsPage")
)
const EditSingleDayFormPage = lazy(
    () => import("./Components/Pages/EditSingleDayFormPage")
)
const EditMultiDayFormPage = lazy(
    () => import("./Components/Pages/EditMultiDayFormPage")
)
const BioPage = lazy(() => import("./Components/Pages/BioPage"))
const ManageUsersPage = lazy(() => import("./Components/Pages/ManageUsersPage"))
const ManageAllEventsPage = lazy(
    () => import("./Components/Pages/ManageAllEventsPage")
)
const ManageUserEventsPage = lazy(
    () => import("./Components/Pages/ManageUserEventsPage")
)
import "./styles/app-disabled.css"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { useRemoveAppLoadingScreen } from "./hooks/useRemoveAppLoadingScreen"
import { Icon } from "./Components/Common/Icon"

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault("Asia/Jerusalem")

export enum EventAction {
    edit,
    create,
    recycle,
}

export const CACHE_VERSION = "1.6.77"

export const EMAIL_SUPPORT = "info@ci-events.org"
export const PAYBOX_URL = "https://payboxapp.page.link/32yzdN1D1gix4AR37"
export const DATE_LIMIT = dayjs().add(1, "year").toDate()

const DisableAppNotice = () => {
    return (
        <section className="app-disabled">
            <span>
                <Icon icon="settings" className="event-icon spinning" />
            </span>
            <h2 className="app-disabled-title">קונטקט אימפרוביזציה ישראל</h2>
            <h3 className="app-disabled-subtitle">סגור לרגל שיפוצים</h3>
        </section>
    )
}

const disableApp = import.meta.env.VITE_DISABLE_APP

const App = () => {
    const navigate = useNavigate()
    useRemoveAppLoadingScreen()
    if (disableApp === "true") {
        return (
            <div className="app">
                <BackgroundTiles />
                <div
                    className="app-content"
                    style={{ width: "100%", maxWidth: "500px" }}
                >
                    <DisableAppNotice />
                </div>
            </div>
        )
    }
    return (
        <div className="app">
            <SpeedInsights />
            <BackgroundTiles />

            <div
                className="app-content"
                style={{ width: "100%", maxWidth: "500px" }}
            >
                <ErrorBoundary navigate={navigate}>
                    <Suspense fallback={<EventsPageSkeleton />}>
                        <AppHeader />
                        <Routes>
                            <Route
                                path="signup"
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <Signup />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="login"
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <Login />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="reset-password-request"
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <ResetPasswordRequest />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="/event/:eventId"
                                element={<EventsPage />}
                            />
                            <Route path="/:eventId" element={<EventsPage />} />
                            <Route path="/" element={<EventsPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route
                                path="/privacy-policy"
                                element={<PrivacyPolicyPage />}
                            />
                            <Route
                                path="/terms-and-conditions"
                                element={<TCPage />}
                            />

                            <Route
                                path="/reset-password"
                                element={<ResetPasswordPage />}
                            />

                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[
                                            UserType.admin,
                                            UserType.creator,
                                            UserType.org,
                                            UserType.user,
                                            UserType.profile,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path="/filters-and-notifications"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <NotificationsPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/request"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <SupportPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/request/:requestId"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <SupportPage />
                                        </Suspense>
                                    }
                                />
                            </Route>

                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[
                                            UserType.profile,
                                            UserType.admin,
                                            UserType.creator,
                                            UserType.org,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path="/bio"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <BioPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/bio/request/:requestId"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <SupportPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/bio/request"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <SupportPage />
                                        </Suspense>
                                    }
                                />
                            </Route>

                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[
                                            UserType.admin,
                                            UserType.creator,
                                            UserType.org,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path="/manage-events"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageUserEventsPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/create-events"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <CreateEventsPage />
                                        </Suspense>
                                    }
                                />

                                <Route
                                    path="/create-events/single-day"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <SingleDayFormPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/manage-events/edit-single-day/:eventId"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <EditSingleDayFormPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/create-events/multi-day"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <MultiDayFormPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/manage-events/edit-multi-day/:eventId"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <EditMultiDayFormPage />
                                        </Suspense>
                                    }
                                />
                            </Route>

                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[UserType.admin]}
                                    />
                                }
                            >
                                <Route
                                    path="/manage-all-events"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageAllEventsPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/manage-users"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageUsersPage />
                                        </Suspense>
                                    }
                                />

                                <Route
                                    path="/manage-support"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageSupportPage />
                                        </Suspense>
                                    }
                                />
                            </Route>
                            <Route path="*" element={<EventsPage />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    )
}

export default observer(App)
