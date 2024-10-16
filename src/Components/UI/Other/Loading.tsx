import { useRef } from "react"

export default function Loading() {
    const randomLoaderId = useRef(Math.floor(Math.random() * 10) + 1)
    return (
        <div className="loading-component">
            <div className={`loader-wrapper-${randomLoaderId.current}`}>
                <span className={"loader"}></span>
            </div>
        </div>
    )
}
