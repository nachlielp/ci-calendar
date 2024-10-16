import { useNavigate } from "react-router-dom"
import Card from "antd/es/card"
import Form from "antd/es/form"
import Input from "antd/es/input"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import {
    IAddress,
    CIEvent,
    UserType,
    CITemplate,
} from "../../../util/interfaces"
import Loading from "../Other/Loading"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import EventSegmentsForm from "./EventSegmentsForm"
import { EventAction } from "../../../App"
import { useUser } from "../../../context/UserContext"
import { cieventsService } from "../../../supabase/cieventsService"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { templateService } from "../../../supabase/templateService"
import { utilService } from "../../../util/utilService"

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
    isTemplate = false,
    event,
    template,
    closeForm,
}: {
    editType: EventAction
    isTemplate?: boolean
    event?: CIEvent
    template?: CITemplate
    closeForm: () => void
}) {
    const navigate = useNavigate()
    const { teachers } = useTeachersList({ addSelf: true })
    const { user } = useUser()

    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    const [form] = Form.useForm()

    //TODO move to custom hook

    if (!event && !template) return <Loading />

    const { currentFormValues, address } = event
        ? utilService.CIEventToFormValues(event)
        : template
        ? utilService.singleDayTemplateToFormValues(template)
        : { currentFormValues: {}, address: null }

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
        console.log("EditSingleDayEventForm.handleSubmit.values: ", values)
        // const eventDateString = Array.isArray(values["event-date"])
        //     ? values["event-date"][0]
        //     : values["event-date"]
        const baseDate = dayjs(values["event-start-date"])

        if (!baseDate.isValid()) {
            throw new Error("Invalid event date")
        }

        const segments = [
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
                type: values["event-type"] || "",
                tags: values["event-tags"] || [],
                teachers: utilService.formatTeachersForCIEvent(
                    values["teachers"],
                    teachers
                ),
            },
        ]
        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                const segmentDateString1 = Array.isArray(segment["event-time"])
                    ? segment["event-time"][0]
                    : segment["event-time"]
                const segmentDateString2 = Array.isArray(segment["event-time"])
                    ? segment["event-time"][1]
                    : segment["event-time"]

                segments.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatTeachersForCIEvent(
                        segment.teachers,
                        teachers
                    ),
                    startTime: baseDate
                        .clone()
                        .hour(segmentDateString1.hour())
                        .minute(segmentDateString1.minute())
                        .toISOString(),
                    endTime: baseDate
                        .clone()
                        .hour(segmentDateString2.hour())
                        .minute(segmentDateString2.minute())
                        .toISOString(),
                })
            })
        }

        if (event) {
            const eventId =
                editType === EventAction.recycle ? uuidv4() : event.id
            const updatedEvent: CIEvent = {
                start_date: baseDate
                    .hour(13)
                    .minute(0)
                    .second(0)
                    .format("YYYY-MM-DDTHH:mm:ss"),
                end_date: baseDate
                    .hour(13)
                    .minute(0)
                    .second(0)
                    .format("YYYY-MM-DDTHH:mm:ss"),
                type: "",
                id: eventId,
                address: (newAddress || address) as IAddress,
                created_at: event.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [{ value: user.user_id, label: user.full_name }],
                links: values["links"] || [],
                price: values["prices"] || [],
                hide: false,
                segments: segments,
                district: values["district"],
                creator_id: user.user_id,
                creator_name: user.full_name,
                source_template_id: event.source_template_id,
                is_multi_day: false,
                multi_day_teachers: [],
            }
            try {
                if (editType === EventAction.recycle) {
                    try {
                        await cieventsService.createCIEvent(updatedEvent)
                        closeForm()
                    } catch (error) {
                        console.error(
                            "EventForm.handleSubmit.createEvent.error: ",
                            error
                        )
                        throw error
                    }
                } else {
                    try {
                        await cieventsService.updateCIEvent(
                            eventId,
                            updatedEvent
                        )
                        closeForm()
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
        } else if (template) {
            const updatedTemplate: CITemplate = {
                type: "",
                template_id: template.template_id,
                address: (newAddress || address) as IAddress,
                created_at: template.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [{ value: user.user_id, label: user.full_name }],
                links: values["links"] || [],
                price: values["prices"] || [],
                segments: segments,
                district: values["district"],
                is_multi_day: false,
                multi_day_teachers: [],
                name: values["template-name"],
                created_by: user.user_id,
            }
            console.log(
                "EditSingleDayEventForm.handleSubmit.updatedTemplate: ",
                updatedTemplate
            )
            try {
                await templateService.updateTemplate(updatedTemplate)
                closeForm()
            } catch (error) {
                console.error(
                    "EventForm.handleSubmit.updateTemplate.error: ",
                    error
                )
            }
        }
    }

    const submitText = isTemplate
        ? "עדכון תבנית"
        : editType === EventAction.recycle
        ? "שיכפול אירוע"
        : "עדכון אירוע"

    const titleText = isTemplate
        ? "עדכון תבנית - חד יומי"
        : editType === EventAction.recycle
        ? "שיכפול אירוע - חד יומי"
        : "עדכון אירוע - חד יומי"

    return (
        <>
            <Card className="edit-single-day-event-form">
                <Form
                    {...formItemLayout}
                    form={form}
                    onFinish={handleSubmit}
                    variant="filled"
                    labelCol={{ span: 6, offset: 0 }}
                    wrapperCol={{ span: 16, offset: 0 }}
                    initialValues={currentFormValues}
                >
                    {isTemplate && (
                        <Form.Item name="template-name" label="שם התבנית">
                            <Input allowClear />
                        </Form.Item>
                    )}
                    <SingleDayEventFormHead
                        form={form}
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        handleEndDateChange={handleEndDateChange}
                        eventDate={eventDate}
                        endDate={endDate}
                        isEdit={true}
                        teachers={teachers}
                        address={address || ({} as IAddress)}
                        titleText={titleText}
                        isTemplate={isTemplate}
                    />
                    <EventSegmentsForm form={form} teachers={teachers} />
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
