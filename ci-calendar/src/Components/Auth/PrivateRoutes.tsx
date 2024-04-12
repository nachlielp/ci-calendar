import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const PrivateRoutes: React.FC<{}> = ({}) => {
  const authContext = useAuth();
  if (!authContext) {
    throw new Error("AuthContext is null, make sure you're within a Provider");
  }
  const { currentUser } = authContext;
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};
