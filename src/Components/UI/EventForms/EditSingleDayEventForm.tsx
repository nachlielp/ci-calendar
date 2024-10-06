import { useNavigate, useParams } from "react-router-dom"
// import { useAuthContext } from "../../Auth/AuthContext"
import { Card, Form } from "antd"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { IAddress, CIEvent, UserType } from "../../../util/interfaces"
import Loading from "../Other/Loading"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import SingleDayEventBaseForm from "./SingleDayEventBaseForm"
import SubEventsForm from "./SubEventsForm"
import { formatTeachers } from "./SingleDayEventForm"
import { EventAction } from "../../../App"
import { useUser } from "../../../context/UserContext"
import { cieventsService } from "../../../supabase/cieventsService"
import { useTeachersList } from "../../../hooks/useTeachersList"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
    },
}

export default function EditSingleDayEventForm({
    editType,
}: {
    editType: EventAction
}) {
    const navigate = useNavigate()
    const { teachers } = useTeachersList()
    // const { getEvent, updateEvent, createEvent } = useAuthContext()
    const { user } = useUser()
    const { eventId } = useParams<{ eventId: string }>()
    const [eventData, setEventData] = useState<CIEvent | null>(null)
    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    const [form] = Form.useForm()

    //TODO move to custom hook
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                if (eventId) {
                    const eventData = await cieventsService.getCIEvent(eventId)
                    setEventData(eventData)
                    setEventDate(dayjs(eventData.startDate))
                }
            } catch (error) {
                console.error(
                    "EditSingleDayEventForm.fetchEvent.error: ",
                    error
                )
                throw error
            }
        }
        fetchEvent()
    }, [eventId])

    if (!eventData) return <Loading />

    const { currentFormValues, address } = eventToFormValues(eventData)

    const handleAddressSelect = (place: IGooglePlaceOption) => {
        const selectedAddress = {
            label: place.label,
            place_id: place.value.place_id,
        }
        setNewAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
    }

    const handleDateChange = (date: dayjs.Dayjs) => {
        setEventDate(date)
    }

    const handleEndDateChange = (date: dayjs.Dayjs) => {
        setEndDate(date)
    }
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    if (
        user.user_type !== UserType.admin &&
        user.user_type !== UserType.creator
    ) {
        navigate("/")
    }

    const handleSubmit = async (values: any) => {
        // console.log("EventForm.handleSubmit.values: ", values);

        const baseDate = dayjs(values["event-date"]) // Clone the base date

        const subEvents = [
            {
                startTime: baseDate
                    .clone()
                    .hour(values["event-time"][0].hour())
                    .minute(values["event-time"][0].minute())
                    .toISOString(),
                endTime: baseDate
                    .clone()
                    .hour(values["event-time"][1].hour())
                    .minute(values["event-time"][1].minute())
                    .toISOString(),
                type: values["event-types"] || "",
                tags: values["event-tags"] || [],
                teachers: formatTeachers(values["teachers"], teachers),
            },
        ]
        if (values["sub-events"]) {
            values["sub-events"].forEach((subEvent: any) => {
                subEvents.push({
                    type: subEvent.type,
                    tags: subEvent.tags || [],
                    teachers: formatTeachers(subEvent.teachers, teachers),
                    startTime: baseDate
                        .clone()
                        .hour(subEvent.time[0].hour())
                        .minute(subEvent.time[0].minute())
                        .toISOString(),
                    endTime: baseDate
                        .clone()
                        .hour(subEvent.time[1].hour())
                        .minute(subEvent.time[1].minute())
                        .toISOString(),
                })
            })
        }

        const eventId =
            editType === EventAction.recycle ? uuidv4() : eventData.id
        const event: CIEvent = {
            startDate: baseDate
                .hour(13)
                .minute(0)
                .second(0)
                .format("YYYY-MM-DDTHH:mm:ss"),
            endDate: baseDate
                .hour(13)
                .minute(0)
                .second(0)
                .format("YYYY-MM-DDTHH:mm:ss"),
            type: "",
            id: eventId,
            address: newAddress || address,
            createdAt: eventData.createdAt,
            updatedAt: dayjs().toISOString(),
            title: values["event-title"],
            description: values["event-description"] || "",
            owners: [{ value: user.user_id, label: user.fullName }],
            links: values["links"] || [],
            price: values["prices"] || [],
            hide: false,
            subEvents: subEvents,
            district: values["district"],
            creatorId: user.user_id,
            creatorName: user.fullName,
        }
        try {
            // console.log("EventForm.handleSubmit.event: ", event);
            if (editType === EventAction.recycle) {
                try {
                    await cieventsService.createCIEvent(event)
                    navigate("/manage-events")
                } catch (error) {
                    console.error(
                        "EventForm.handleSubmit.createEvent.error: ",
                        error
                    )
                    throw error
                }
            } else {
                try {
                    await cieventsService.updateCIEvent(eventId, event)
                    navigate("/manage-events")
                } catch (error) {
                    console.error(
                        "EventForm.handleSubmit.updateEvent.error: ",
                        error
                    )
                    throw error
                }
            }
        } catch (error) {
            console.error("EventForm.handleSubmit.error: ", error)
        }
    }

    const submitText =
        editType === EventAction.recycle ? "שיכפול אירוע" : "עדכון אירוע"

    return (
        <>
            <Card className="event-card">
                <Form
                    {...formItemLayout}
                    form={form}
                    onFinish={handleSubmit}
                    variant="filled"
                    labelCol={{ span: 6, offset: 0 }}
                    wrapperCol={{ span: 16, offset: 0 }}
                    initialValues={currentFormValues}
                >
                    <SingleDayEventBaseForm
                        form={form}
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        handleEndDateChange={handleEndDateChange}
                        eventDate={eventDate}
                        endDate={endDate}
                        isEdit={true}
                        teachers={teachers}
                        address={address}
                    />
                    <SubEventsForm day="" form={form} teachers={teachers} />
                    <AddLinksForm />
                    <AddPricesForm />

                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <button type="submit" className="general-action-btn">
                            {submitText}
                        </button>
                    </Form.Item>
                </Form>
            </Card>
            <div className="footer-space"></div>
        </>
    )
}

function eventToFormValues(event: CIEvent) {
    const currentFormValues = {
        "event-title": event.title,
        "event-description": event.description,
        address: event.address,
        district: event.district,
        "event-types": event.subEvents[0]?.type,
        "event-tags": event.subEvents[0]?.tags,
        teachers: reverseFormatTeachers(event.subEvents[0]?.teachers),
        "event-date": dayjs.tz(
            dayjs(event.subEvents[0]?.startTime),
            "Asia/Jerusalem"
        ),
        "event-time": [
            dayjs(event.subEvents[0]?.startTime).tz("Asia/Jerusalem"),
            dayjs(event.subEvents[0]?.endTime).tz("Asia/Jerusalem"),
        ],
        "sub-events": event.subEvents.slice(1).map((subEvent) => ({
            type: subEvent.type,
            tags: subEvent.tags,
            teachers: reverseFormatTeachers(subEvent.teachers),
            time: [
                dayjs(subEvent.startTime).tz("Asia/Jerusalem"),
                dayjs(subEvent.endTime).tz("Asia/Jerusalem"),
            ],
        })),
        links: event.links.map((link) => ({
            title: link.title,
            link: link.link,
        })),
        prices: event.price.map((price) => ({
            title: price.title,
            sum: price.sum,
        })),
    }
    // console.log("currentFormValues: ", currentFormValues);
    return { currentFormValues, address: event.address }
}

export function reverseFormatTeachers(
    teachers: { label: string; value: string }[]
) {
    return teachers?.map((teacher) =>
        teacher.value !== "NON_EXISTENT" ? teacher.value : teacher.label
    )
}
