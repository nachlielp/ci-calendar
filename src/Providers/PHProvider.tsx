import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PHProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const getUserId = () => {
            const persistedId = posthog.get_distinct_id()
            if (persistedId && !persistedId.startsWith("user-")) {
                return persistedId
            }

            const storedId = localStorage.getItem("custom_user_id")
            if (storedId) {
                return storedId
            }

            const newId = `user_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`
            localStorage.setItem("custom_user_id", newId)
            return newId
        }

        const phKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
        const phHost =
            import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
            "https://app.posthog.com"

        posthog.reset()

        try {
            posthog.init(phKey, {
                api_host: phHost,
                autocapture: true,
                capture_pageview: true,
                capture_pageleave: true,
                persistence: "localStorage",
                persistence_name: "ph_custom_persistence",
                loaded: () => {
                    const userId = getUserId()
                    posthog.identify(userId)
                },
            })
        } catch (error) {
            console.error("PostHog initialization error:", error)
        }

        return () => {
            posthog.reset()
        }
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
