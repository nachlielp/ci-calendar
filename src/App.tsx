import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"
import Loading from "./Components/UI/Other/Loading"
import AppHeader from "./Components/UI/Other/AppHeader"
import ResetPasswordRequest from "./Components/Auth/ResetPasswordRequest"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import Login from "./Components/Auth/Login"
import Signup from "./Components/Auth/Signup"
import BackgroundTiles from "./Components/UI/Other/BackgroundTiles"

import EventsPage from "./Components/Pages/EventsPage"

import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { SpeedInsights } from "@vercel/speed-insights/react"
import EventsPageSkeleton from "./Components/UI/DisplayEvents/EventsPageSkeleton"
import { useCIEvents } from "./context/CIEventsContext"

const CreateEventsPage = lazy(
    () => import("./Components/Pages/CreateEventsPage")
)
const ManageEventsTable = lazy(
    () => import("./Components/UI/DisplayEvents/ManageEventsTable")
)
const SupportPage = lazy(() => import("./Components/Pages/SupportPage"))
const ManageSupportPage = lazy(
    () => import("./Components/Pages/ManageSupportPage")
)
const FiltersAndNotificationsPage = lazy(
    () => import("./Components/Pages/FiltersAndNotificationsPage")
)
const BioPage = lazy(() => import("./Components/Pages/BioPage"))
const AdminPage = lazy(() => import("./Components/Pages/AdminPage"))
const ManageUsers = lazy(() => import("./Components/UI/Other/ManageUsers"))

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

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
                                            <ManageEventsTable />
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
                                    path="/admin"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <AdminPage />
                                        </Suspense>
                                    }
                                />
                                <Route
                                    path="/manage-users"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageUsers />
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
