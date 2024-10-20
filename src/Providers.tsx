import React from "react"
import { SessionProvider } from "./context/SessionContext"
import { UserProvider } from "./context/UserContext"
import ConfigProvider from "antd/es/config-provider"
import { TemplatesProvider } from "./context/TemplatesContext"
import { CIEventsProvider } from "./context/CIEventsContext"
interface ProvidersProps {
    children: React.ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ConfigProvider direction="rtl">
            <SessionProvider>
                <UserProvider>
                    <TemplatesProvider>
                        <CIEventsProvider> {children}</CIEventsProvider>
                    </TemplatesProvider>
                </UserProvider>
            </SessionProvider>
        </ConfigProvider>
    )
}

export default Providers
