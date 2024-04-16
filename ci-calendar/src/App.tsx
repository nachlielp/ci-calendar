import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserType } from "./Firebase";

import { AuthProvider } from "./Components/Auth/AuthContext";
import Signup from "./Components/Auth/Signup";
import Login from "./Components/Auth/Login";
import ResetPassword from "./Components/Auth/ResetPassword";
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes";
import Header from "./Components/UI/Header";
import UserPage from "./Components/UserPage";
import TeacherPage from "./Components/TeacherPage";
import EventForm, { IEvent } from "./Components/UI/EventForm";
import EventsList from "./Components/UI/EventsList";
import EditEventsContainer from "./Components/UI/EditEventsContainer";
import { firebaseService } from "./firebase.service";

export default function App() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initTFirebase = async () => {
      firebaseService.initFirebaseJS();
      firebaseService.subscribe("events", (events: any) => {
        setEvents(events);
        setLoading(false);
      });
    };
    initTFirebase();
  }, []);

  if (loading) {
    //TODO handel loading
    return <div>Loading...</div>;
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
              <Route path="/home" element={<EventsList events={events} />} />
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
                <Route path="/test" element={<EventForm />} />
                <Route path="/teacher" element={<TeacherPage />} />
                <Route path="/event-form" element={<EventForm />} />
                <Route path="/edit-events" element={<EditEventsContainer />} />
              </Route>

              {/* Admin privet routes */}
              <Route
                element={<PrivateRoutes requiredRoles={[UserType.admin]} />}
              >
                {/* <Route path="/event-form" element={<EventForm />} /> */}
              </Route>
              <Route path="*" element={<EventsList events={events} />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}
