import { useEffect } from "react"

export const useRemoveAppLoadingScreen = () => {
    useEffect(() => {
        const loader = document.getElementById("initial-loader")
        if (loader) {
            loader.remove()
        }
    }, [])
}
