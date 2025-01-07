import React from "react"
import { ConfigProvider } from "antd"

interface ProvidersProps {
    children: React.ReactNode
}

import { PHProvider } from "./Providers/PHProvider"

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ConfigProvider
            direction="rtl"
            theme={{
                token: {
                    colorPrimary: "#444444",
                },
                components: {
                    Spin: { dotSizeLG: 60 },
                },
            }}
        >
            <PHProvider> {children}</PHProvider>
        </ConfigProvider>
    )
}

export default Providers
