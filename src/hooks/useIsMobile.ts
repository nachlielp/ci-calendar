import { useState, useEffect } from "react"
import { ScreenSize } from "../util/options"

export const useIsMobile = () => {
    const [width, setWidth] = useState(window.innerWidth)

    const handleResize = () => {
        setWidth(window.innerWidth)
    }

    useEffect(() => {
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return width < ScreenSize.mobile
}
