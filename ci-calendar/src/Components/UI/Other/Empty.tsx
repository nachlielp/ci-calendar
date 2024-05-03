import { Empty } from "antd";

export default function EmptyList() {
  return (
    <div
      className={`flex flex-col items-center justify-center h-screen bg-homepage-bg `}
    >
      <Empty>
        <div className="content" />
      </Empty>
    </div>
  );
}
