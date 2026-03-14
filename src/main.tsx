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
