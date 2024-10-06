import { Empty } from "antd";

export default function EmptyList() {
  return (
    <div
      className='empty-list'
    >
      <Empty>
        <div className="content" />
      </Empty>
    </div>
  );
}
