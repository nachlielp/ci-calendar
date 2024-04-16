import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { eventTypes, districtOptions, SelectOption } from "../../util/options";
import { useSearchParams } from "react-router-dom";

export default function FilterModel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialValues = useCallback(
    (paramName: string, options: SelectOption[]) => {
      const params = searchParams.getAll(paramName);
      return options
        .filter((option) => params.includes(option.value))
        .map((option) => option.value);
    },
    [searchParams]
  );

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    getInitialValues("eventType", eventTypes)
  );
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    getInitialValues("district", districtOptions)
  );

  const onOptionsChange = (type: string) => (values: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(type);
    values.forEach((value) => newSearchParams.append(type, value));
    setSearchParams(newSearchParams, { replace: true });
  };

  const clearSearchParams = () => {
    setSearchParams("", { replace: true });
  };
  useEffect(() => {
    setSelectedEventTypes(getInitialValues("eventType", eventTypes));
    setSelectedDistricts(getInitialValues("district", districtOptions));
  }, [searchParams, getInitialValues]);

  return (
    <>
      <Button
        type="primary"
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center mr-4"
      >
        <FilterOutlined />
      </Button>
      <Modal
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={<Button onClick={clearSearchParams}>נקה </Button>}
      >
        <div>
          <b>סוג אירוע</b>
        </div>
        <Checkbox.Group
          options={eventTypes}
          value={selectedEventTypes}
          onChange={onOptionsChange("eventType")}
        />
        <div>
          <b>אזור</b>
        </div>
        <Checkbox.Group
          options={districtOptions}
          value={selectedDistricts}
          onChange={onOptionsChange("district")}
        />
      </Modal>
      <br />
    </>
  );
}
