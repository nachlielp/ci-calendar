import { Spin } from "antd"

export default function Loading() {
    return (
        <div className="loading-component">
            <Spin size="large">
                <div className="content" />
            </Spin>
        </div>
    )
}
