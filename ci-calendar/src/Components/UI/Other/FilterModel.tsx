import { useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import { eventTypes, districtOptions } from "../../../util/options";
import { useParamsHandler } from "../../../hooks/useParamsHandler";
import { Icon } from "./Icon";

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
        onClick={() => setModalOpen(true)}
        className={`flex items-center justify-center mr-4 ${currentEventTypeValues.length || currentDistrictValues.length ? 'bg-gray-300' : ''}`}
      >
        <Icon icon="instantMix" className="w-6 h-6 " />
      </Button>
      <Modal
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={<Button onClick={clearAllSearchParams}>נקה </Button>}
      >
        <div>
          <b className="text-lg">סוג אירוע</b>
        </div>
        <Checkbox.Group
          value={currentEventTypeValues}
          onChange={onEventTypeOptionsChange("eventType")}
        >
          {eventTypes.filter(eventType => eventType.value !== "warmup").map(eventType => (
            <Checkbox key={eventType.value} value={eventType.value} style={{ transform: 'scale(1.2)', margin: '6px' }}>
              <p className="text-lg">{eventType.label}</p>
            </Checkbox>
          ))}
        </Checkbox.Group>
        <div>
          <b className="text-lg">אזור</b>
        </div>
        <Checkbox.Group
          // options={districtOptions}
          value={currentDistrictValues}
          onChange={onDistrictOptionsChange("district")}
        >
          {districtOptions.map(district => (
            <Checkbox key={district.value} value={district.value} style={{ transform: 'scale(1.2)', margin: '6px' }}>
              <p className="text-lg">{district.label}</p>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>
      <br />
    </>
  );
}
