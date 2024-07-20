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

  const isSelectedFilter = currentEventTypeValues.length || currentDistrictValues.length;

  return (
    <div className="filter-model-container">
      <Button
        onClick={() => setModalOpen(true)}
        className={`anchor-btn ${isSelectedFilter && 'active'}`}
      >
        <p className="text">
          סינון
        </p>
        <Icon icon="instantMix" className="filter-model-icon" />
      </Button>

      <Modal
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={<Button onClick={clearAllSearchParams} className="default-font">נקה </Button>}
      >
        <div>
          <b className="filter-model-title default-font">סוג אירוע</b>
        </div>
        <Checkbox.Group
          value={currentEventTypeValues}
          onChange={onEventTypeOptionsChange("eventType")}
        >
          {eventTypes.filter(eventType => eventType.value !== "warmup").map(eventType => (
            <Checkbox key={eventType.value} value={eventType.value} className="filter-model-checkbox">
              <p className="filter-model-checkbox-label default-font">{eventType.label}</p>
            </Checkbox>
          ))}
        </Checkbox.Group>
        <div>
          <b className="filter-model-title">אזור</b>
        </div>
        <Checkbox.Group
          value={currentDistrictValues}
          onChange={onDistrictOptionsChange("district")}
        >
          {districtOptions.map(district => (
            <Checkbox key={district.value} value={district.value} className="filter-model-checkbox">
              <p className="filter-model-checkbox-label default-font">{district.label}</p>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>
    </div>
  );
}
