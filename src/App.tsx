import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"
import dayjs from "dayjs"
import Header from "./Components/UI/Other/Header"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { useEvents } from "./hooks/useEvents"
import { SpeedInsights } from "@vercel/speed-insights/react"
import CreateEventsPage from "./Components/Pages/CreateEventsPage"
import BackgroundTiles from "./Components/UI/Other/BackgroundTiles"
const Signup = lazy(() => import("./Components/Auth/Signup"))
const Login = lazy(() => import("./Components/Auth/Login"))
const ResetPasswordRequest = lazy(
    () => import("./Components/Auth/ResetPasswordRequest")
)
const NewsletterPage = lazy(() => import("./Components/Pages/NewsletterPage"))
const BioPage = lazy(() => import("./Components/Pages/BioPage"))
const EditSingleDayEventForm = lazy(
    () => import("./Components/UI/EventForms/EditSingleDayEventForm")
)
const Loading = lazy(() => import("./Components/UI/Other/Loading"))
const AdminPage = lazy(() => import("./Components/Pages/AdminPage"))
const ManageUsers = lazy(() => import("./Components/UI/Other/ManageUsers"))
const EventsPage = lazy(() => import("./Components/Pages/EventsPage"))
const EditMultiDayEventForm = lazy(
    () => import("./Components/UI/EventForms/EditMultiDayEventForm")
)
const ManageEventsTable = lazy(
    () => import("./Components/UI/DisplayEvents/ManageEventsTable")
)
import SupportPage from "./Components/Pages/SupportPage"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import { WeeklyEventsPage } from "./Components/Pages/WeeklyEventsPage"

export enum EventAction {
    edit,
    create,
    recycle,
}

export default function App() {
    const { events, loading, viewableTeachers } = useEvents({
        startDate: dayjs().format("YYYY-MM-DD"),
        hideClosed: true,
    })

    if (loading) {
        return <Loading />
    }

    return (
        <div className="app">
            <SpeedInsights />
            <BackgroundTiles />
            <div
                className="app-content"
                style={{ width: "100%", maxWidth: "500px" }}
            >
                <Suspense fallback={<Loading />}>
                    <Header />
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
                                    isEdit={false}
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
                                element={<NewsletterPage />}
                            />
                            <Route path="/request" element={<SupportPage />} />
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
                            <Route
                                path="/edit-single-day-event/:eventId"
                                element={
                                    <EditSingleDayEventForm
                                        editType={EventAction.edit}
                                    />
                                }
                            />
                            <Route
                                path="/recycle-single-day-event/:eventId"
                                element={
                                    <EditSingleDayEventForm
                                        editType={EventAction.recycle}
                                    />
                                }
                            />
                            <Route
                                path="/edit-multi-day-event/:eventId"
                                element={
                                    <EditMultiDayEventForm
                                        editType={EventAction.edit}
                                    />
                                }
                            />
                            <Route
                                path="/recycle-multi-day-event/:eventId"
                                element={
                                    <EditMultiDayEventForm
                                        editType={EventAction.recycle}
                                    />
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
                            <Route path="/admin" element={<AdminPage />} />
                            <Route
                                path="/manage-users"
                                element={<ManageUsers />}
                            />
                            <Route
                                path="/manage-events"
                                element={<ManageEventsTable />}
                            />
                        </Route>
                        <Route
                            path="*"
                            element={
                                <EventsPage
                                    events={events}
                                    isEdit={false}
                                    viewableTeachers={viewableTeachers}
                                />
                            }
                        />
                    </Routes>
                </Suspense>
            </div>
        </div>
    )
}
