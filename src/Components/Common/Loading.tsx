// import { useRef } from "react"

import Spin from "antd/es/spin"

export default function Loading() {
    // const randomLoaderId = useRef(Math.floor(Math.random() * 10) + 1)
    return (
        <div className="loading-component">
            <Spin />
            {/* <div className={`loader-wrapper-9`}>
                <span className={"loader"}></span>
            </div> */}
        </div>
    )
}
