import { useEffect } from "react"

/** index.html shows a branded loader until the app has rendered once. */
export function useRemoveInitialLoader() {
    useEffect(() => {
        document.getElementById("initial-loader")?.remove()
    }, [])
}
