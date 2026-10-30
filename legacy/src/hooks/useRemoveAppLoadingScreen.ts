import { useEffect } from "react"
//Remove the loader set in the index.html when the app is loaded
export const useRemoveAppLoadingScreen = () => {
    useEffect(() => {
        const loader = document.getElementById("initial-loader")
        if (loader) {
            loader.remove()
        }
    }, [])
}
