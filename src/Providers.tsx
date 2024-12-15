import React from "react"
import { ConfigProvider } from "antd"

interface ProvidersProps {
    children: React.ReactNode
}

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
            {children}
        </ConfigProvider>
    )
}

export default Providers
