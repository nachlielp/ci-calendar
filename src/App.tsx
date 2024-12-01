import { Suspense, lazy, useState } from "react"
import { Routes, Route } from "react-router-dom"
import "./styles/overrides.css"

import ResetPasswordRequest from "./Components/Auth/ResetPasswordRequest"
import ResetPasswordPage from "./Components/Pages/RestPasswordPage"
import Login from "./Components/Auth/Login"
import Signup from "./Components/Auth/Signup"
import EventsPage from "./Components/Pages/EventsPage"
import Loading from "./Components/Common/Loading"
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes"
import EventsPageSkeleton from "./Components/Events/Display/EventsPageSkeleton"
import AppHeader from "./Components/Layout/AppHeader"
import BackgroundTiles from "./Components/Layout/BackgroundTiles"

import { UserType } from "./util/interfaces"
import { SpeedInsights } from "@vercel/speed-insights/react"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { observer } from "mobx-react-lite"
import { store } from "./Store/store"

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
const ManageAllEventsPage = lazy(
    () => import("./Components/Pages/ManageAllEventsPage")
)
const UserEventsListPage = lazy(
    () => import("./Components/Pages/UserEventListPage")
)

dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.tz.setDefault("Asia/Jerusalem")

export enum EventAction {
    edit,
    create,
    recycle,
}

const App = () => {
    const [image, setImage] = useState<string | null>(null)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Prevent any form submission or navigation
        e.preventDefault()
        e.stopPropagation()

        const file = e.target.files?.[0]
        if (!file) return

        try {
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImage(event.target.result as string)
                }
            }
            reader.readAsDataURL(file)

            // Reset the input value
            e.target.value = ""
        } catch (error) {
            console.error("Error reading file:", error)
        }
    }
    return (
        <div className="app">
            <SpeedInsights />
            <BackgroundTiles />
            <h1>v - 9</h1>
            <div onClick={(e) => e.stopPropagation()}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    id="imageInput"
                    // Prevent any default form behavior
                    onClick={(e) => e.stopPropagation()}
                />
                {image && (
                    <img
                        src={image}
                        alt="uploaded"
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: "100px", height: "100px" }}
                    />
                )}
            </div>
            {store.isLoading ? (
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
                                path="/event/:eventId"
                                element={<EventsPage />}
                            />
                            <Route path="/:eventId" element={<EventsPage />} />
                            <Route path="/" element={<EventsPage />} />
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
                                    path="/request/:requestId"
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
                            <Route path="*" element={<EventsPage />} />
                        </Routes>
                    </Suspense>
                </div>
            )}
        </div>
    )
}

export default observer(App)
