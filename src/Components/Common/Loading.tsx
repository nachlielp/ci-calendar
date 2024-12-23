import Spin from "antd/es/spin"
import "../../styles/loading.css"
import "../../styles/error-boundary.css"

// export default function Loading() {
//     return (
//         <div className="loading-component">
//             <Spin size="large" />
//         </div>
//     )
// }

import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Icon } from "./Icon"

const Loading = () => {
    const [isStuck, setIsStuck] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setIsStuck(true)
            console.log("Loading timeout reached")
        }, 30000)

        return () => clearTimeout(timeoutId)
    }, [])

    if (isStuck) {
        return (
            <div className="error-container">
                <h2> נראה שמשהו השתבש</h2>
                <Icon icon="warning" className="warning-icon" />
                <button
                    onClick={() => {
                        navigate("/")
                        window.location.reload()
                    }}
                    className="general-action-btn large-btn"
                >
                    חזרה לדף הבית
                </button>
            </div>
        )
    }

    return (
        <div className="loading-component">
            <Spin size="large" />
        </div>
    )
}

export default Loading
