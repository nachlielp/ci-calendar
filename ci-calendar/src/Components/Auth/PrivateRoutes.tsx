import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import { UserType } from "../../../drizzle/schema";

interface PrivateRoutesProps {
  requiredRoles?: UserType[];
}

export const PrivateRoutes: React.FC<PrivateRoutesProps> = ({
  requiredRoles: requiredRoles,
}) => {
  const authContext = useAuthContext();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser, loading } = authContext;
  console.log("PrivateRoutes.currentUser", currentUser);
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.userType)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};
