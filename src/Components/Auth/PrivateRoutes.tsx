import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { UserType } from "../../util/interfaces"
import Loading from "../Common/Loading"
import { useUser } from "../../context/UserContext"

interface PrivateRoutesProps {
    requiredRoles?: UserType[]
}

export const PrivateRoutes: React.FC<PrivateRoutesProps> = ({
    requiredRoles: requiredRoles,
}) => {
    const { user, loading } = useUser()

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return <Navigate to="/login" />
    }
    if (requiredRoles && !requiredRoles.includes(user.user_type)) {
        return <Navigate to="/" />
    }

    return <Outlet />
}
