import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { UserType } from "../../util/interfaces"
import Loading from "../Common/Loading"
import { store } from "../../Store/store"

interface PrivateRoutesProps {
    requiredRoles?: UserType[]
}

export const PrivateRoutes: React.FC<PrivateRoutesProps> = ({
    requiredRoles: requiredRoles,
}) => {
    if (store.isLoading) {
        return <Loading />
    }

    if (!store.getUser) {
        return <Navigate to="/login" />
    }
    if (requiredRoles && !requiredRoles.includes(store.getUser.user_type)) {
        return <Navigate to="/" />
    }

    return <Outlet />
}
