import { useState } from "react";
import { Modal } from "antd";
import SingleDayEventForm from "./SingleDayEventForm";
import MultiDayEventForm from "./MultiDayEventForm";

export default function AddEventModal({
  anchorEl,
  eventType,
}: {
  anchorEl: any;
  eventType: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div onClick={showModal}>{anchorEl}</div>
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        {eventType === "single-day" ? (
          <SingleDayEventForm />
        ) : (
          <MultiDayEventForm />
        )}
      </Modal>
    </>
  );
}
