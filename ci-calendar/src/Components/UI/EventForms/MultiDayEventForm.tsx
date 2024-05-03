import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../Auth/AuthContext";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  TimePicker,
} from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import "../../../styles/overrides.css";
import { v4 as uuidv4 } from "uuid";

import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { tagOptions, eventTypes, districtOptions } from "../../../util/options";
import { IAddress, IEvently, UserType } from "../../../util/interfaces";
import GooglePlacesInput, {
  IGooglePlaceOption,
} from "../Other/GooglePlacesInput";
import { useState } from "react";
import SubEventsForm from "./SubEventsForm";
import SubEventBase from "./SubEventBase";
import AddLinksForm from "./AddLinksForm";
import AddPricesForm from "./AddPricesForm";
import MultiDayFormHead from "./MultiDayFormHead";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault("Asia/Jerusalem");

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

const initialValues = {
  "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
  "event-tags": [tagOptions[0].value],
};

export default function MultiDayEventForm() {
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [schedule, setSchedule] = useState(false);
  const navigate = useNavigate();
  const { currentUser, createEvent } = useAuthContext();
  const [address, setAddress] = useState<IAddress>();
  if (!currentUser) {
    throw new Error("currentUser is null, make sure you're within a Provider");
  }

  if (
    currentUser.userType !== UserType.admin &&
    currentUser.userType !== UserType.teacher
  ) {
    navigate("/");
  }
  const [form] = Form.useForm();

  const handleAddressSelect = (place: IGooglePlaceOption) => {
    const selectedAddress = {
      label: place.label,
      place_id: place.value.place_id,
    };
    setAddress(selectedAddress);
    form.setFieldValue("address", selectedAddress);
  };

  const handleScheduleChange = (checked: boolean) => {
    setSchedule(checked);
  };

  const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
    setDates(dates);
  };
  const handleSubmit = async (values: any) => {
    console.log(values);
    // const subEventsTemplate = [
    //   {
    //     startTime: dayjs(values["event-time"][0]),
    //     endTime: dayjs(values["event-time"][1]),
    //     type: values["event-types"],
    //     tags: values["event-tags"] || [],
    //     teacher: values["event-teacher"] || "",
    //   },
    // ];

    // if (values["sub-events"]) {
    //   values["sub-events"].forEach((subEvent: any) =>
    //     subEventsTemplate.push({
    //       type: subEvent.type,
    //       tags: subEvent.tags || [],
    //       teacher: subEvent.teacher || "",
    //       startTime: dayjs(subEvent.time[0]),
    //       endTime: dayjs(subEvent.time[1]),
    //     })
    //   );
    // }

    if (!address || !dates) {
      return;
    }

    try {
      const event: IEvently = {
        dates: {
          startDate: dates[0].toISOString(),
          endDate: dates[1].toISOString(),
        },
        type: values["main-event-type"],
        id: uuidv4(),
        address: address,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        title: values["event-title"],
        description: values["event-description"] || "",
        owners: [currentUser.id],
        links: values["links"] || [],
        price: values["prices"] || [],
        hide: false,
        subEvents: [],
        district: values["district"],
      };

      // await createEvent(event);

      // navigate("/");
    } catch (error) {
      console.error("EventForm.handleSubmit.error: ", error);
      throw error;
    }
  };

  return (
    <Card className="max-w-[500px] mx-auto  mt-4 ">
      <Form
        {...formItemLayout}
        form={form}
        onFinish={handleSubmit}
        variant="filled"
        labelCol={{ span: 6, offset: 0 }}
        wrapperCol={{ span: 16, offset: 0 }}
        initialValues={initialValues}
      >
        <MultiDayFormHead
          handleAddressSelect={handleAddressSelect}
          handleDateChange={handleDateChange}
          handleScheduleChange={handleScheduleChange}
          schedule={schedule}
        />

        {schedule && (
          <Form.List name="days">
            {(days, { add, remove }) => (
              <>
                {days.map(({ key, name, ...restField }) => (
                  <div key={key}>
                    <SubEventBase day={name} {...restField} remove={remove} />
                  </div>
                ))}
                <div className="flex items-center justify-center mt-2">
                  <Button onClick={() => add()} block>
                    <PlusOutlined /> הוסף יום
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        )}
        <AddLinksForm />
        <AddPricesForm />
        <Form.Item
          wrapperCol={{ span: 24 }}
          className="mt-4 flex justify-center"
        >
          <Button type="primary" htmlType="submit">
            צור אירוע
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
