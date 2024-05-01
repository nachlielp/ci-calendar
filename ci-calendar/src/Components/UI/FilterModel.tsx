import { useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { eventTypes, districtOptions } from "../../util/options";
import { useParamsHandler } from "../../hooks/useParamsHandler";

export default function FilterModel() {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    currentValues: currentEventTypeValues,
    onOptionsChange: onEventTypeOptionsChange,
    clearSearchParams,
  } = useParamsHandler({ title: "eventType", options: eventTypes });

  const {
    currentValues: currentDistrictValues,
    onOptionsChange: onDistrictOptionsChange,
  } = useParamsHandler({ title: "district", options: districtOptions });

  const clearAllSearchParams = () => {
    clearSearchParams(["eventType", "district"]);
  };

  return (
    <>
      <Button
        type={currentDistrictValues.length ? "primary" : "default"}
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center mr-4"
      >
        <FilterOutlined />
      </Button>
      <Modal
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={<Button onClick={clearAllSearchParams}>נקה </Button>}
      >
        <div>
          <b>סוג אירוע</b>
        </div>
        <Checkbox.Group
          options={eventTypes}
          value={currentEventTypeValues}
          onChange={onEventTypeOptionsChange("eventType")}
        />
        <div>
          <b>אזור</b>
        </div>
        <Checkbox.Group
          options={districtOptions}
          value={currentDistrictValues}
          onChange={onDistrictOptionsChange("district")}
        />
      </Modal>
      <br />
    </>
  );
}
