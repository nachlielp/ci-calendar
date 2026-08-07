import { useEffect } from "react"
import { useLocation } from "react-router"
import posthog from "posthog-js"

export default function PostHogPageView() {
    const location = useLocation()

    // Track pageviews
    useEffect(() => {
        if (posthog) {
            posthog.capture("$pageview", {
                $current_url: window.location.href,
            })
        }
    }, [location])

    return null
}
