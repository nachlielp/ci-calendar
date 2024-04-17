import { Spin } from "antd";

function Loading() {
  return (
    <div
      className={`flex flex-col items-center justify-center h-screen bg-homepage-bg `}
    >
      <Spin size="large">
        <div className="content" />
      </Spin>
    </div>
  );
}

export default Loading;
