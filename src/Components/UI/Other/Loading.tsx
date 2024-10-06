import { Spin } from "antd";

function Loading() {
  return (
    <div
      className="loading-component"
    >
      <Spin size="large">
        <div className="content" />
      </Spin>
    </div>
  );
}

export default Loading;
