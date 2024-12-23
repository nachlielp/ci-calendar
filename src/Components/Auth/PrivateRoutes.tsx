import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { UserType } from "../../util/interfaces"
import Loading from "../Common/Loading"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"

interface PrivateRoutesProps {
    requiredRoles?: UserType[]
}

export const PrivateRoutes: React.FC<PrivateRoutesProps> = observer(
    ({ requiredRoles: requiredRoles }) => {
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
)
