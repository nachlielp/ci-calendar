import { useNavigate } from "react-router-dom"
import { useAuthContext } from "../../Auth/AuthContext"
import { Button, Form } from "antd"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "../../../styles/overrides.css"
import { v4 as uuidv4 } from "uuid"

import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { tagOptions } from "../../../util/options"
import {
    IAddress,
    IEventiPart,
    CIEvent,
    UserType,
} from "../../../util/interfaces"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import MultiDayFormHead from "./MultiDayFormHead"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { formatTeachers } from "./SingleDayEventForm"
import { useUser } from "../../../context/UserContext"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

// const formItemLayout = {
//   labelCol: {
//     xs: { span: 24 },
//     sm: { span: 6 },
//   },
//   wrapperCol: {
//     xs: { span: 24 },
//     sm: { span: 14 },
//   },
// };

const initialValues = {
    "event-date": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

export default function MultiDayEventForm() {
    const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null)
    const navigate = useNavigate()
    const { teachers } = useTeachersList()
    const { user } = useUser()
    const { createEvent } = useAuthContext()
    const [address, setAddress] = useState<IAddress>()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    if (
        user.userType !== UserType.admin &&
        user.userType !== UserType.teacher
    ) {
        navigate("/")
    }
    const [form] = Form.useForm()

    const handleAddressSelect = (place: IGooglePlaceOption) => {
        const selectedAddress = {
            label: place.label,
            place_id: place.value.place_id,
        }
        setAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
    }

    const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
        setDates(dates)
    }
    const handleSubmit = async (values: any) => {
        // console.log("MultiDayEventForm.handleSubmit.values: ", values);

        const subEventsTemplate: IEventiPart[] = []

        values.days?.forEach((day: any) => {
            const startTime: string = dayjs(day["event-date-base"])
                .hour(dayjs(day["event-time-base"][0]).hour())
                .minute(dayjs(day["event-time-base"][0]).minute())
                .toISOString()
            const endTime: string = dayjs(day["event-date-base"])
                .hour(dayjs(day["event-time-base"][1]).hour())
                .minute(dayjs(day["event-time-base"][1]).minute())
                .toISOString()
            subEventsTemplate.push({
                startTime: startTime,
                endTime: endTime,
                type: day["event-type-base"],
                tags: day["event-tags-base"] || [],
                teachers: formatTeachers(day["event-teacher-base"], teachers),
            })

            // Additional sub-events for each day
            day["sub-events"]?.forEach((subEvent: any) => {
                const startTime: string = dayjs(day["event-date-base"])
                    .hour(dayjs(subEvent.time[0]).hour())
                    .minute(dayjs(subEvent.time[0]).minute())
                    .toISOString()
                const endTime: string = dayjs(day["event-date-base"])
                    .hour(dayjs(subEvent.time[1]).hour())
                    .minute(dayjs(subEvent.time[1]).minute())
                    .toISOString()
                subEventsTemplate.push({
                    type: subEvent.type,
                    tags: subEvent.tags || [],
                    teachers: formatTeachers(subEvent.teacher, teachers),
                    startTime: startTime,
                    endTime: endTime,
                })
            })
        })

        if (!address || !dates) {
            return
        }

        try {
            const event: CIEvent = {
                startDate: dates[0].toISOString(),
                endDate: dates[1].toISOString(),
                type: values["main-event-type"],
                id: uuidv4(),
                address: address,
                createdAt: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [{ value: user.id, label: user.fullName }],
                links: values["links"] || [],
                price: values["prices"] || [],
                hide: false,
                subEvents: subEventsTemplate,
                district: values["district"],
                creatorId: user.id,
                creatorName: user.fullName,
            }
            console.log("MultiDayEventForm.handleSubmit.event: ", event)
            await createEvent(event)

            navigate("/")
        } catch (error) {
            console.error("EventForm.handleSubmit.error: ", error)
            throw error
        }
    }

    return (
        <>
            <section className="multi-day-event-form">
                <Form
                    // {...formItemLayout}
                    form={form}
                    onFinish={handleSubmit}
                    variant="filled"
                    // labelCol={{ span: 6, offset: 0 }}
                    // wrapperCol={{ span: 16, offset: 0 }}
                    initialValues={initialValues}
                >
                    <MultiDayFormHead
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                    />
                    <hr className="divider" />
                    <label>
                        <b>קישור</b> (יופיע ככפתור בעמוד האירוע)
                    </label>
                    <AddLinksForm />
                    <hr className="divider" />
                    <label>
                        <b>מחיר</b>
                    </label>
                    <AddPricesForm />
                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                    >
                        <Button type="primary" htmlType="submit">
                            צור אירוע
                        </Button>
                    </Form.Item>
                </Form>
            </section>
            <div className="footer-space"></div>
        </>
    )
}
