import React from "react"
import { ConfigProvider } from "antd"
import * as Sentry from "@sentry/react"
import { Routes } from "react-router"

interface ProvidersProps {
    children: React.ReactNode
}

import { PHProvider } from "./Providers/PHProvider"
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes)

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
            <PHProvider>
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child) && child.type === Routes) {
                        return (
                            <SentryRoutes>{child.props.children}</SentryRoutes>
                        )
                    }
                    return child
                })}
            </PHProvider>
        </ConfigProvider>
    )
}

export default Providers
