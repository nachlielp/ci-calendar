import Spin from "antd/es/spin"
import "../../styles/loading.css"

export default function Loading() {
    return (
        <div className="loading-component">
            <Spin size="large" />
        </div>
    )
}
