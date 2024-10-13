import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.scss"
import Providers from "./Providers.tsx"
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById("root")!).render(
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
            .then((registration) => {
                console.log(
                    "Service Worker registered with scope:",
                    registration.scope
                )

                // Check for updates to the service worker
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing

                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === "installed") {
                                if (navigator.serviceWorker.controller) {
                                    // New update available
                                    console.log(
                                        "New or updated content is available."
                                    )
                                    // Optionally, prompt the user to refresh the page
                                    // window.location.reload(); - leads to an infinite reload
                                } else {
                                    // Content is cached for offline use
                                    console.log(
                                        "Content is now available offline!"
                                    )
                                }
                            }
                        }
                    }
                }
            })
            .catch((error) => {
                console.error("Service Worker registration failed:", error)
            })
    })
}
