import { useState, useEffect } from "react"
import { ScreenSize } from "../util/options"

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        window.innerWidth < ScreenSize.mobile
    )

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            `(max-width: ${ScreenSize.mobile - 1}px)`
        )

        setIsMobile(mediaQuery.matches)

        const handleChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches)
        }

        mediaQuery.addEventListener("change", handleChange)

        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [])

    return isMobile
}
