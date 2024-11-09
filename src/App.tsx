import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"

import ResetPasswordRequest from "./Components/Auth/ResetPasswordRequest"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import Login from "./Components/Auth/Login"
import Signup from "./Components/Auth/Signup"

import EventsPage from "./Components/Pages/EventsPage"

import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { SpeedInsights } from "@vercel/speed-insights/react"

const CreateEventsPage = lazy(
    () => import("./Components/Pages/CreateEventsPage")
)

const SupportPage = lazy(() => import("./Components/Pages/SupportPage"))
const ManageSupportPage = lazy(
    () => import("./Components/Pages/ManageSupportPage")
)
const FiltersAndNotificationsPage = lazy(
    () => import("./Components/Pages/FiltersAndNotificationsPage")
)
const BioPage = lazy(() => import("./Components/Pages/BioPage"))
const ManageUsersPage = lazy(() => import("./Components/Pages/ManageUsersPage"))

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import ManageAllEventsPage from "./Components/Pages/ManageAllEventsPage"
import UserEventsListPage from "./Components/Pages/UserEventListPage"
import Loading from "./Components/Common/Loading"
import EventsPageSkeleton from "./Components/Events/Display/EventsPageSkeleton"
import AppHeader from "./Components/Layout/AppHeader"
import { useCIEvents } from "./Context/CIEventsContext"
import BackgroundTiles from "./Components/UI/Layout/BackgroundTiles"

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault("Asia/Jerusalem")

export enum EventAction {
    edit,
    create,
    recycle,
}

export default function App() {
    const { ci_events, loading } = useCIEvents()

    return (
        <div className="app">
            <SpeedInsights />
            <BackgroundTiles />
            {loading ? (
                <EventsPageSkeleton />
            ) : (
                <div
                    className="app-content"
                    style={{ width: "100%", maxWidth: "500px" }}
                >
                    <Suspense fallback={<EventsPageSkeleton />}>
                        <AppHeader />
                        <Routes>
                            <Route path="signup" element={<Signup />} />
                            <Route path="login" element={<Login />} />

                            <Route
                                path="reset-password-request"
                                element={<ResetPasswordRequest />}
                            />
                            <Route
                                path="/"
                                element={<EventsPage events={ci_events} />}
                            />
                            <Route
                                path="/:eventId"
                                element={<EventsPage events={ci_events} />}
                            />
                            {/* <Route
                                path="/weekly-events"
                                element={<WeeklyEventsPage events={events} />}
                            /> */}
                            {/* User privet routes */}
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
                                    element={<FiltersAndNotificationsPage />}
                                />
                                <Route
                                    path="/request"
                                    element={<SupportPage />}
                                />
                                <Route
                                    path="/reset-password"
                                    element={<ResetPasswordPage />}
                                />
                            </Route>

                            {/* Profile privet routes */}
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
                            </Route>

                            {/* Creator privet routes */}
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
                                            <UserEventsListPage />
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
                            </Route>

                            {/* Admin privet routes */}
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
                            <Route
                                path="*"
                                element={<EventsPage events={ci_events} />}
                            />
                        </Routes>
                    </Suspense>
                </div>
            )}
        </div>
    )
}
