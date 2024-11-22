import React from "react"
import ConfigProvider from "antd/es/config-provider"
interface ProvidersProps {
    children: React.ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return <ConfigProvider direction="rtl">{children}</ConfigProvider>
}

export default Providers
