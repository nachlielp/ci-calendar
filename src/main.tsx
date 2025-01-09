import "./instrument.js"
import './index.scss'
import Providers from "./Providers.tsx"
import { BrowserRouter } from "react-router"
import App from "./App.tsx"

import { createRoot } from "react-dom/client"
const container = document.getElementById("root")
if (!container) throw new Error("Root element not found")
const root = createRoot(container)

root.render(
    <BrowserRouter>
        <Providers>
            <App />
        </Providers>
    </BrowserRouter>
)

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/firebase-messaging-sw.js")
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
