import { Form, Input, Select, DatePicker, Card } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { districtOptions, eventTypes } from "../../../util/options";
import GooglePlacesInput, {
  IGooglePlaceOption,
} from "../Other/GooglePlacesInput";
import { IAddress } from "../../../util/interfaces";

interface IMultiDayFormHeadProps {
  handleAddressSelect: (place: IGooglePlaceOption) => void;
  handleDateChange: (dates: [Dayjs, Dayjs]) => void;
  address?: IAddress;
}

export default function MultiDayFormHead({
  handleAddressSelect,
  handleDateChange,
  address,
}: IMultiDayFormHeadProps) {
  function onDatesChange(dates: [Dayjs, Dayjs]) {
    handleDateChange(dates);
  }
  return (
    <Card
      className="multi-day-form-head-card"
      title={<span className="multi-day-form-head-title">ארוע רב יומי</span>}
    >
      <Form.Item
        label="כותרת"
        name="event-title"
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="תיאור האירוע" name="event-description">
        <Input.TextArea rows={6} />
      </Form.Item>
      <Form.Item
        className="multi-day-form-head-item"
        label="אזור"
        name="district"
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <Select options={districtOptions} />
      </Form.Item>
      <Form.Item
        className="multi-day-form-head-item"
        label="כתובת"
        name="address"
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <GooglePlacesInput
          onPlaceSelect={handleAddressSelect}
          defaultValue={address}
        />
      </Form.Item>
      <Form.Item
        label="תאריכים"
        name="event-date"
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <DatePicker.RangePicker
          className="single-month"
          format={"DD/MM"}
          minDate={dayjs()}
          maxDate={dayjs().add(1, "year")}
          mode={["date", "date"]}
          onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
            if (dates) {
              onDatesChange(dates as [Dayjs, Dayjs]);
            }
          }}
        />
      </Form.Item>
      <Form.Item
        className="multi-day-form-head-full-width"
        label="סוג האירוע"
        name="main-event-type"
        rules={[{ required: true, message: "שדה חובה" }]}
      >
        <Select options={eventTypes} />
      </Form.Item>
    </Card>
  );
}
