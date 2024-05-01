import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./Components/Auth/AuthContext";
import Signup from "./Components/Auth/Signup";
import Login from "./Components/Auth/Login";
import ResetPassword from "./Components/Auth/ResetPassword";
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes";
import Header from "./Components/UI/Header";
import UserPage from "./Components/UserPage";
import TeacherPage from "./Components/TeacherPage";
import EventForm from "./Components/UI/EventForm";
import { UserType } from "./util/interfaces";
import BioPage from "./Components/UI/BioPage";
import EditEventForm from "./Components/UI/EditEventForm";
import Loading from "./Components/UI/Loading";
import AdminPage from "./Components/AdminPage";
import ManageUsers from "./Components/UI/ManageUsers";
import { useEvents } from "./hooks/useEvents";
import TestPage from "./Components/TestPage";
import EventsDisplay from "./Components/UI/EventsDisplay";
import MultiDayEventForm from "./Components/UI/MultiDayEventForm";

export default function App() {
  const { events, loading } = useEvents();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full sm:w-11/12 md:max-w-screen-md bg-homepage-bg">
        <BrowserRouter>
          <AuthProvider>
            <Header />
            <Routes>
              <Route path="signup" element={<Signup />} />
              <Route path="login" element={<Login />} />

              <Route path="reset-password" element={<ResetPassword />} />
              <Route
                path="/"
                element={<EventsDisplay events={events} isEdit={false} />}
              />
              {/* User privet routes */}
              <Route
                element={
                  <PrivateRoutes
                    requiredRoles={[
                      UserType.admin,
                      UserType.teacher,
                      UserType.user,
                    ]}
                  />
                }
              >
                <Route path="/user" element={<UserPage />} />
              </Route>

              {/* Teacher privet routes */}

              <Route
                element={
                  <PrivateRoutes
                    requiredRoles={[UserType.admin, UserType.teacher]}
                  />
                }
              >
                <Route path="/teacher" element={<TeacherPage />} />
                <Route path="/event-form" element={<EventForm />} />
                <Route
                  path="/multi-day-event-form"
                  element={<MultiDayEventForm />}
                />
                <Route
                  path="/edit-events-list"
                  element={<EventsDisplay events={events} isEdit={true} />}
                />
                <Route
                  path="/edit-event/:eventId"
                  element={<EditEventForm />}
                />
                <Route path="/bio" element={<BioPage />} />
              </Route>

              {/* Admin privet routes */}
              <Route
                element={<PrivateRoutes requiredRoles={[UserType.admin]} />}
              >
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/test" element={<TestPage />} />
              </Route>
              <Route
                path="*"
                element={<EventsDisplay events={events} isEdit={false} />}
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}
