import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import Providers from "./Providers.tsx"
import { BrowserRouter } from "react-router-dom"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
const options = {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
}
if (import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, options)
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Providers>
            <PostHogProvider client={posthog}>
                <App />
            </PostHogProvider>
        </Providers>
    </BrowserRouter>
)

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then(async (registration) => {
                console.log(
                    "_Service Worker registered with scope:",
                    registration.scope
                )

                // Wait for the service worker to be ready
                await navigator.serviceWorker.ready
                console.log("Service worker ready")
                // Listen for messages from the service worker
                navigator.serviceWorker.addEventListener("message", (event) => {
                    console.log("Received message:", event)
                    if (event.data && event.data.type === "PUSH_NOTIFICATION") {
                        // Handle the push notification data here
                        // You can update your app state, refresh data, etc.
                        console.log("Received push notification:", event.data)
                    }
                })
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error)
            })
    })
}
