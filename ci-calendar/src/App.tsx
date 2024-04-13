import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Firebase from "./Firebase";

// import RetentionTimer from "./Components/RetentionTimer";
// import History from "./Components/History";
// import MeditationTimer from "./Components/MeditationTimer";
import { AuthProvider } from "./Components/Auth/AuthContext";
import Signup from "./Components/Auth/Signup";
import Login from "./Components/Auth/Login";
import ResetPassword from "./Components/Auth/ResetPassword";
import { PrivateRoutes } from "./Components/Auth/PrivateRoutes";
import HomePage from "./Components/HomePage";
import Header from "./Components/Header";
import EventForm from "./Components/EventForm";
import { UserType } from "../drizzle/schema";
import TestForm from "./Components/TestForm";
import SimpleEventForm from "./Components/SimpleEventForm";

export default function App() {
  const [firebase, setFirebase] = useState<Firebase | null>(null);

  useEffect(() => {
    const fbInstance = new Firebase();
    setFirebase(fbInstance);
  }, []);

  if (!firebase) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full sm:w-11/12 md:max-w-screen-md bg-homepage-bg">
        <BrowserRouter>
          <AuthProvider firebase={firebase}>
            <Header />
            <Routes>
              <Route path="signup" element={<Signup />} />
              <Route path="login" element={<Login />} />

              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="/home" element={<HomePage />} />
              {/* User privet routes */}
              <Route element={<PrivateRoutes />}></Route>

              {/* Teacher privet routes */}
              <Route
                element={
                  <PrivateRoutes
                    requiredRoles={[UserType.admin, UserType.teacher]}
                  />
                }
              >
                <Route path="/event-form" element={<SimpleEventForm />} />
                <Route path="/test-form" element={<TestForm />} />
              </Route>

              {/* Admin privet routes */}
              <Route
                element={<PrivateRoutes requiredRoles={[UserType.admin]} />}
              >
                {/* <Route path="/event-form" element={<EventForm />} /> */}
              </Route>
              <Route path="*" element={<HomePage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}
