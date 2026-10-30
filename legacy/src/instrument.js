import * as Sentry from "@sentry/react"

import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from "react-router"
import React from "react"

// Immediately invoke Sentry initialization
const initSentry = () => {
    // Don't initialize Sentry in development mode
    if (import.meta.env.MODE === "development") {
        console.log("Sentry disabled in development mode")
        return
    }

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
                // Privacy: mask everything in session replays. All text and
                // input values are masked and all media is blocked, so replays
                // never record user content. `networkDetailAllowUrls: []` keeps
                // request/response bodies and headers (auth tokens, API
                // payloads) out of the replay — only timing/status is kept.
                Sentry.replayIntegration({
                    maskAllText: true,
                    maskAllInputs: true,
                    blockAllMedia: true,
                    networkDetailAllowUrls: [],
                }),
            ],
            beforeSend(event) {
                return event
            },
            debug: false,
            tracesSampleRate: 0.2,
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
            replaysSessionSampleRate: 0.05,
            replaysOnErrorSampleRate: 0.5,
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
