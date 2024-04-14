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
  const { currentUser, loading } = useAuthContext();

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
