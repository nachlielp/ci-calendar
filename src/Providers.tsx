import React from "react"
import { UserProvider } from "./Context/UserContext"
import ConfigProvider from "antd/es/config-provider"
import { CIEventsProvider } from "./Context/CIEventsContext"
import { SessionProvider } from "./Context/SessionContext"
interface ProvidersProps {
    children: React.ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ConfigProvider direction="rtl">
            <SessionProvider>
                <UserProvider>
                    <CIEventsProvider> {children}</CIEventsProvider>
                </UserProvider>
            </SessionProvider>
        </ConfigProvider>
    )
}

export default Providers
