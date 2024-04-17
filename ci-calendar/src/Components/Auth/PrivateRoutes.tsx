import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import { UserType } from "../../util/interfaces";
import Loading from "../UI/Loading";

interface PrivateRoutesProps {
  requiredRoles?: UserType[];
}

export const PrivateRoutes: React.FC<PrivateRoutesProps> = ({
  requiredRoles: requiredRoles,
}) => {
  const { currentUser, loading } = useAuthContext();

  if (loading) {
    return <Loading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  if (requiredRoles && !requiredRoles.includes(currentUser.userType)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};
