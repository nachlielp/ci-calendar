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
            integrations: [
                Sentry.reactRouterV7BrowserTracingIntegration({
                    useEffect: React.useEffect,
                    useLocation,
                    useNavigationType,
                    createRoutesFromChildren,
                    matchRoutes,
                }),
                Sentry.replayIntegration(),
            ],
            beforeSend(event) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "Test error sent to Sentry. Check your Sentry dashboard."
                    )
                }
                return event
            },
            debug: false,
            tracesSampleRate: 1.0,
            allowUrls: [window.location.origin, /^https:\/\/ci-events\.org/],
            tracePropagationTargets: [
                window.location.origin,
                /^https:\/\/ci-events\.org/,
            ],
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
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
