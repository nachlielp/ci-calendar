import React, { useEffect, useState } from "react"

const BackgroundTiles: React.FC = () => {
    const [tileCount, setTileCount] = useState(0)
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const calculateTiles = () => {
            const screenHeight = window.innerHeight
            const screenWidth = window.innerWidth
            const tilesNeeded = Math.ceil(screenHeight / screenWidth) + 1
            setTileCount(tilesNeeded)
        }

        const handleOnlineStatus = () => {
            setIsOnline(navigator.onLine)
        }

        calculateTiles()
        window.addEventListener("resize", calculateTiles)
        window.addEventListener("online", handleOnlineStatus)
        window.addEventListener("offline", handleOnlineStatus)

        return () => {
            window.removeEventListener("resize", calculateTiles)
            window.removeEventListener("online", handleOnlineStatus)
            window.removeEventListener("offline", handleOnlineStatus)
        }
    }, [])

    return (
        <div className={`background-container ${!isOnline ? "offline" : ""}`}>
            {[...Array(tileCount)].map((_, index) => (
                <div key={index} className="background-tile" />
            ))}
        </div>
    )
}

export default BackgroundTiles
