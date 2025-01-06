import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"
import { useLocation } from "react-router"

export function PHProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation()

    useEffect(() => {
        // Initialize PostHog with capture_pageview: false since we'll handle it manually
        posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            capture_pageview: false,
        })
    }, [])

    // Track pageviews on location change
    useEffect(() => {
        if (posthog) {
            posthog.capture("$pageview", {
                $current_url: window.location.href,
            })
        }
    }, [location])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
