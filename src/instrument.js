import { useEffect } from "react"
import * as Sentry from "@sentry/react"
import dontev from "dotenv"

import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from "react-router"
import React from "react"

// Immediately invoke Sentry initialization
const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN
    // console.log("__dsn: ", dsn)
    if (!dsn || dsn === "null" || dsn === "undefined") {
        console.warn("No Sentry DSN found. Sentry will not be initialized.")
        return
    }

    try {
        Sentry.init({
            dsn,
            enabled: true,
            environment: import.meta.env.MODE,
            integrations:
                import.meta.env.MODE === "production"
                    ? [
                          Sentry.reactRouterV7BrowserTracingIntegration({
                              useEffect: React.useEffect,
                              useLocation,
                              useNavigationType,
                              createRoutesFromChildren,
                              matchRoutes,
                          }),
                          Sentry.replayIntegration(),
                      ]
                    : [], // No performance monitoring integrations in development
            beforeSend(event) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "Test error sent to Sentry. Check your Sentry dashboard."
                    )
                }
                return event
            },
            debug: false,
            tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
            allowUrls: [
                window.location.origin,
                "https://ci-events.org",
                "https://www.ci-events.org",
            ],
            tracePropagationTargets: [
                window.location.origin,
                "https://ci-events.org",
                "https://www.ci-events.org",
            ],
            // Reduce sampling rates in production to prevent timeouts
            replaysSessionSampleRate:
                import.meta.env.MODE === "production" ? 0.05 : 0.1,
            replaysOnErrorSampleRate:
                import.meta.env.MODE === "production" ? 0.5 : 1.0,
        })
    } catch (error) {
        console.error("Failed to initialize Sentry:", error)
    }
}

// Initialize immediately
initSentry()

// Add global error handler
window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason)
})
