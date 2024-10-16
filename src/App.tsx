import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"
import dayjs from "dayjs"
import AppHeader from "./Components/UI/Other/AppHeader"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { useEvents } from "./hooks/useEvents"
import { SpeedInsights } from "@vercel/speed-insights/react"
const CreateEventsPage = lazy(
    () => import("./Components/Pages/CreateEventsPage")
)
import BackgroundTiles from "./Components/UI/Other/BackgroundTiles"

const ManageEventsTable = lazy(
    () => import("./Components/UI/DisplayEvents/ManageEventsTable")
)

const SupportPage = lazy(() => import("./Components/Pages/SupportPage"))
const ResetPasswordPage = lazy(
    () => import("./Components/Pages/RestPasswordPage")
)
// import { WeeklyEventsPage } from "./Components/Pages/WeeklyEventsPage"
const ManageSupportPage = lazy(
    () => import("./Components/Pages/ManageSupportPage")
)
import Loading from "./Components/UI/Other/Loading"
const ResetPasswordRequest = lazy(
    () => import("./Components/Auth/ResetPasswordRequest")
)
const Login = lazy(() => import("./Components/Auth/Login"))
const Signup = lazy(() => import("./Components/Auth/Signup"))
import EventsPage from "./Components/Pages/EventsPage"
const FiltersAndNotificationsPage = lazy(
    () => import("./Components/Pages/FiltersAndNotificationsPage")
)
const BioPage = lazy(() => import("./Components/Pages/BioPage"))
const AdminPage = lazy(() => import("./Components/Pages/AdminPage"))
const ManageUsers = lazy(() => import("./Components/UI/Other/ManageUsers"))

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
                                        ]}
                                    />
                                }
                            >
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
                                    path="/manage-events"
                                    element={
                                        <Suspense fallback={<Loading />}>
                                            <ManageEventsTable />
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
