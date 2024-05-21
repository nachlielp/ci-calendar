import {
  Form,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Row,
  Col,
  Card,
  InputNumber,
  List,
  TimePicker,
} from "antd";
import {
  InfoCircleOutlined,
} from "@ant-design/icons";
import VirtualList from "rc-virtual-list";
import GooglePlacesInput, {
  IGooglePlaceOption,
} from "../Other/GooglePlacesInput";
import dayjs from "dayjs";
import { districtOptions, eventTypes, tagOptions } from "../../../util/options";
import {
  EventFrequency,
  formatMonthlyDate,
  listOfDates,
  repeatOptions,
  repeatEventTooltip,
} from "./SingleDayEventForm";
import { IAddress } from "../../../util/interfaces";

interface ISingleDayEventBaseFormProps {
  form: any;
  handleAddressSelect: (place: IGooglePlaceOption) => void;
  handleDateChange: (date: dayjs.Dayjs) => void;
  handleEndDateChange: (date: dayjs.Dayjs) => void;
  handleRepeatChange?: () => void;
  repeatOption?: EventFrequency;
  eventDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs | null;
  idEdit: boolean;
  teachers: { label: string, value: string }[];
  address?: IAddress;
}

export default function SingleDayEventBaseForm({
  form,
  handleAddressSelect,
  handleDateChange,
  handleEndDateChange,
  handleRepeatChange,
  teachers,
  repeatOption,
  eventDate,
  endDate,
  idEdit,
  address
}: ISingleDayEventBaseFormProps) {
  return (
    <>
      <Card className="mt-4 border-4">
        <Form.Item
          label="כותרת"
          name="event-title"
          rules={[{ required: true, message: "שדה חובה" }]}
        >
          <Input />
        </Form.Item>
        <Row>
          <Col lg={24} md={24} xs={24}></Col>
        </Row>
        <Form.Item label="תיאור האירוע" name="event-description">
          <Input.TextArea rows={6} />
        </Form.Item>
        <Form.Item
          className="mt-4"
          label="אזור"
          name="district"
          rules={[{ required: true, message: "שדה חובה" }]}
        >
          <Select options={districtOptions} />
        </Form.Item>

        <Form.Item
          className="mt-4"
          label="כתובת"
          name="address"
          rules={[{ required: true, message: "שדה חובה" }]}
        >
          <GooglePlacesInput onPlaceSelect={handleAddressSelect} defaultValue={address} />
        </Form.Item>

        <Form.Item
          label="תאריך"
          name="event-date"
          rules={[{ required: true, message: "שדה חובה" }]}
        >
          <DatePicker
            format={"DD/MM"}
            minDate={dayjs()}
            maxDate={dayjs().add(1, "year")}
            onChange={handleDateChange}
          />
        </Form.Item>

        {!idEdit && (
          <>
            <Form.Item
              className="mt-4"
              label={
                <Tooltip title={repeatEventTooltip}>
                  חזרה &nbsp;
                  <InfoCircleOutlined />
                </Tooltip>
              }
              name="event-repeat"
              rules={[{ required: true, message: "שדה חובה" }]}
            >
              <Select options={repeatOptions} onChange={handleRepeatChange} />
            </Form.Item>
            {repeatOption === EventFrequency.byWeek && (
              <Form.Item
                label="שבועות"
                name="event-repeat-week-interval"
                className="mt-4"
                rules={[{ required: true, message: "שדה חובה" }]}
              >
                <InputNumber min={1} precision={0} />
              </Form.Item>
            )}
            {repeatOption === EventFrequency.monthly && (
              <Form.Item
                label="תדירות"
                name="event-repeat-week-frequency"
                className="mt-4"
              >
                <Input placeholder={formatMonthlyDate(eventDate)} disabled />
              </Form.Item>
            )}
            {repeatOption !== EventFrequency.none && (
              <>
                <Form.Item
                  label="סיום חזרה"
                  name="event
              זרה-repeat-end-date"
                  className="mt-4"
                  rules={[{ required: true, message: "שדה חובה" }]}
                >
                  <DatePicker
                    format={"DD/MM"}
                    minDate={eventDate}
                    maxDate={dayjs().add(1, "year")}
                    onChange={handleEndDateChange}
                  />
                </Form.Item>
                <Form.Item
                  label="תאריכים"
                  name="event-list-of-dates"
                  className="mt-4"
                >
                  {endDate && repeatOption && (
                    <List>
                      <VirtualList
                        data={listOfDates(
                          eventDate,
                          endDate,
                          repeatOption,
                          form.getFieldValue("event-repeat-week-interval")
                        )}
                        height={200}
                        itemHeight={47}
                        itemKey={(item) =>
                          item.format("DD/MM/YYYY") + item.valueOf()
                        }
                      >
                        {(date: dayjs.Dayjs, index: number) => (
                          <List.Item key={index} className="mr-4">
                            <List.Item.Meta
                              key={index}
                              title={date.format("DD/MM")}
                            />
                          </List.Item>
                        )}
                      </VirtualList>
                    </List>
                  )}
                </Form.Item>

              </>
            )}
          </>
        )}
      </Card>

      <Card className="mt-4 border-2">
        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              className="w-full"
              label="סוג האירוע"
              name="event-types"
              rules={[{ required: true, message: "שדה חובה" }]}
            >
              <Select options={eventTypes} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item
              label="שעות פעילות"
              name="event-time"
              rules={[{ required: true, message: "שדה חובה" }]}
              className="w-full"
            >
              <TimePicker.RangePicker
                format="HH:mm"
                minuteStep={5}
                changeOnScroll
                needConfirm={false}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item label="מורים" name="teachers" className="w-full">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Select or type"
                filterOption={(input, option) => (option?.label ?? "").toLowerCase().indexOf(input.toLowerCase()) >= 0}
                options={teachers}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={10} align="middle">
          <Col md={24} xs={24}>
            <Form.Item label="תגיות" name="event-tags" className="w-full">
              <Select options={tagOptions} mode="multiple" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </>
  );
}
