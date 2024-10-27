import React from "react"
import { SessionProvider } from "./context/SessionContext"
import { UserProvider } from "./context/UserContext"
import ConfigProvider from "antd/es/config-provider"
import { CIEventsProvider } from "./context/CIEventsContext"
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
