import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"
import { AuthProvider } from "./Components/Auth/AuthContext"
import Header from "./Components/UI/Other/Header"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import { UserType } from "./util/interfaces"
import { useEvents } from "./hooks/useEvents"
import { SpeedInsights } from "@vercel/speed-insights/react"
import CreateEventsPage from "./Components/Pages/CreateEventsPage"
import BackgroundTiles from "./Components/UI/Other/BackgroundTiles"
const Signup = lazy(() => import("./Components/Auth/Signup"))
const Login = lazy(() => import("./Components/Auth/Login"))
const ResetPassword = lazy(() => import("./Components/Auth/ResetPassword"))
const UserForm = lazy(() => import("./Components/UI/UserForms/UserForm"))
const TeacherPage = lazy(() => import("./Components/Pages/TeacherPage"))
const EventForm = lazy(
    () => import("./Components/UI/EventForms/SingleDayEventForm")
)
const BioPage = lazy(() => import("./Components/UI/DisplayUsers/BioPage"))
const EditSingleDayEventForm = lazy(
    () => import("./Components/UI/EventForms/EditSingleDayEventForm")
)
const Loading = lazy(() => import("./Components/UI/Other/Loading"))
const AdminPage = lazy(() => import("./Components/Pages/AdminPage"))
const ManageUsers = lazy(() => import("./Components/UI/Other/ManageUsers"))
const EventsDisplay = lazy(() => import("./Components/UI/Other/EventsDisplay"))
const MultiDayEventForm = lazy(
    () => import("./Components/UI/EventForms/MultiDayEventForm")
)
const EditMultiDayEventForm = lazy(
    () => import("./Components/UI/EventForms/EditMultiDayEventForm")
)
const ManageEventsTable = lazy(
    () => import("./Components/UI/DisplayEvents/ManageEventsTable")
)
import dayjs from "dayjs"
import SupportPage from "./Components/Pages/SupportPage"

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
                <AuthProvider>
                    <Suspense fallback={<Loading />}>
                        <Header />
                        <Routes>
                            <Route path="signup" element={<Signup />} />
                            <Route path="login" element={<Login />} />

                            <Route
                                path="reset-password"
                                element={<ResetPassword />}
                            />
                            <Route
                                path="/"
                                element={
                                    <EventsDisplay
                                        events={events}
                                        isEdit={false}
                                        viewableTeachers={viewableTeachers}
                                    />
                                }
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
                                <Route path="/user" element={<UserForm />} />
                                <Route
                                    path="/request"
                                    element={<SupportPage />}
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
                                    path="/teacher"
                                    element={<TeacherPage />}
                                />
                                <Route
                                    path="/create-events"
                                    element={<CreateEventsPage />}
                                />
                                <Route
                                    path="/event-form"
                                    element={<EventForm />}
                                />
                                <Route
                                    path="/multi-day-event-form"
                                    element={<MultiDayEventForm />}
                                />
                                <Route
                                    path="/manage-events"
                                    element={<ManageEventsTable />}
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
                                    <EventsDisplay
                                        events={events}
                                        isEdit={false}
                                        viewableTeachers={viewableTeachers}
                                    />
                                }
                            />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </div>
        </div>
    )
}
