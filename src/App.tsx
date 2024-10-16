import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"
import dayjs from "dayjs"
import AppHeader from "./Components/UI/Other/AppHeader"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { useEvents } from "./hooks/useEvents"
import { SpeedInsights } from "@vercel/speed-insights/react"
import CreateEventsPage from "./Components/Pages/CreateEventsPage"
import BackgroundTiles from "./Components/UI/Other/BackgroundTiles"

import ManageEventsTable from "./Components/UI/DisplayEvents/ManageEventsTable"

import SupportPage from "./Components/Pages/SupportPage"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import { WeeklyEventsPage } from "./Components/Pages/WeeklyEventsPage"
import ManageSupportPage from "./Components/Pages/ManageSupportPage"
import Loading from "./Components/UI/Other/Loading"
import ResetPasswordRequest from "./Components/Auth/ResetPasswordRequest"
import Login from "./Components/Auth/Login"
import Signup from "./Components/Auth/Signup"
import EventsPage from "./Components/Pages/EventsPage"
import FiltersAndNotificationsPage from "./Components/Pages/FiltersAndNotificationsPage"
import BioPage from "./Components/Pages/BioPage"
import AdminPage from "./Components/Pages/AdminPage"
import ManageUsers from "./Components/UI/Other/ManageUsers"

export enum EventAction {
    edit,
    create,
    recycle,
}

export default function App() {
    const { events, loading, viewableTeachers } = useEvents({
        start_date: dayjs().format("YYYY-MM-DD"),
        hide: false,
    })

    return (
        <div className="app">
            <SpeedInsights />
            <BackgroundTiles />
            {loading ? (
                <Loading />
            ) : (
                <div
                    className="app-content"
                    style={{ width: "100%", maxWidth: "500px" }}
                >
                    <Suspense fallback={<Loading />}>
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
                                element={
                                    <EventsPage
                                        events={events}
                                        viewableTeachers={viewableTeachers}
                                    />
                                }
                            />
                            <Route
                                path="/:eventId"
                                element={
                                    <EventsPage
                                        events={events}
                                        viewableTeachers={viewableTeachers}
                                    />
                                }
                            />
                            <Route
                                path="/weekly-events"
                                element={<WeeklyEventsPage events={events} />}
                            />
                            {/* User privet routes */}
                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[
                                            UserType.admin,
                                            UserType.creator,
                                            UserType.user,
                                            UserType.profile,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path="/newsletter"
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
                                        ]}
                                    />
                                }
                            >
                                <Route path="/bio" element={<BioPage />} />
                            </Route>

                            {/* Creator privet routes */}

                            <Route
                                element={
                                    <PrivateRoutes
                                        requiredRoles={[
                                            UserType.admin,
                                            UserType.creator,
                                        ]}
                                    />
                                }
                            >
                                <Route
                                    path="/create-events"
                                    element={<CreateEventsPage />}
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
                                <Route path="/admin" element={<AdminPage />} />
                                <Route
                                    path="/manage-users"
                                    element={<ManageUsers />}
                                />
                                <Route
                                    path="/manage-events"
                                    element={<ManageEventsTable />}
                                />
                                <Route
                                    path="/manage-support"
                                    element={<ManageSupportPage />}
                                />
                            </Route>
                            <Route
                                path="*"
                                element={
                                    <EventsPage
                                        events={events}
                                        viewableTeachers={viewableTeachers}
                                    />
                                }
                            />
                        </Routes>
                    </Suspense>
                </div>
            )}
        </div>
    )
}
