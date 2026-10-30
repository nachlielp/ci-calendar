import React from "react"
import ConfigProvider from "antd/es/config-provider"
import * as Sentry from "@sentry/react"
import { Routes } from "react-router"
import enUS from "antd/locale/en_US"
import heIL from "antd/locale/he_IL"
import ruRU from "antd/locale/ru_RU"
import { LanguageProvider, LanguageContext } from "./Providers/LanguageProvider"

interface ProvidersProps {
    children: React.ReactNode
}

import { PHProvider } from "./Providers/PHProvider"
import { Language } from "./util/interfaces"
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes)

const getAntLocale = (language: Language) => {
    switch (language) {
        case Language.en:
            return enUS
        case Language.he:
            return heIL
        case Language.ru:
            return ruRU
        default:
            return enUS
    }
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <LanguageProvider>
            <LanguageContext.Consumer>
                {({ language }: { language: Language }) => (
                    <ConfigProvider
                        direction={language === Language.he ? "rtl" : "ltr"}
                        locale={getAntLocale(language)}
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
                                if (
                                    React.isValidElement(child) &&
                                    child.type === Routes
                                ) {
                                    return (
                                        <SentryRoutes>
                                            {child.props.children}
                                        </SentryRoutes>
                                    )
                                }
                                return child
                            })}
                        </PHProvider>
                    </ConfigProvider>
                )}
            </LanguageContext.Consumer>
        </LanguageProvider>
    )
}

export default Providers
