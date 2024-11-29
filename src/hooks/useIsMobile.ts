import { useState, useEffect } from "react"
import { ScreenSize } from "../util/options"

export const useIsMobile = () => {
    const [width, setWidth] = useState(window.innerWidth)
    console.log("useIsMobile.width", width)

    const handleResize = () => {
        setWidth(window.innerWidth)
        console.log("useIsMobile.handleResize.width", width)
    }

    useEffect(() => {
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return width < ScreenSize.mobile
}
