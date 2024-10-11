import { useNavigate, useParams } from "react-router-dom"
import { Card, Form, Input } from "antd"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import {
    CIEvent,
    IAddress,
    CIEventSegments,
    CITemplate,
} from "../../../util/interfaces"
import Loading from "../Other/Loading"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import MultiDayFormHead from "./MultiDayFormHead"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { formatTeachers } from "./SingleDayEventForm"
import { reverseFormatTeachers } from "./EditSingleDayEventForm"
import { EventAction } from "../../../App"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "../../../context/UserContext"
import { cieventsService } from "../../../supabase/cieventsService.ts"
import { templateService } from "../../../supabase/templateService.ts"
import { multiDayTemplateToFormValues } from "./MultiDayEventForm.tsx"

export default function EditMultiDayEventForm({
    editType,
    isTemplate = false,
    itemId,
    closeForm,
}: {
    editType: EventAction
    isTemplate: boolean
    itemId: string
    closeForm: () => void
}) {
    const { teachers } = useTeachersList()
    const navigate = useNavigate()
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    const [eventData, setEventData] = useState<CIEvent | null>(null)
    const [templateData, setTemplateData] = useState<CITemplate | null>(null)
    const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null)
    const [currentFormValues, setCurrentFormValues] = useState<any>()
    const [address, setAddress] = useState<IAddress | undefined>()
    const [form] = Form.useForm()

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                if (itemId && !isTemplate) {
                    const res = await cieventsService.getCIEvent(itemId)
                    setEventData(res)
                    if (res) {
                        const { currentFormValues, address } =
                            eventToFormValues(res)
                        setCurrentFormValues(currentFormValues)
                        setDates([
                            dayjs(currentFormValues["event-date"][0]),
                            dayjs(currentFormValues["event-date"][1]),
                        ])
                        setAddress(address)
                    }
                }
                if (itemId && isTemplate) {
                    const templateData = await templateService.getTemplate(
                        itemId
                    )
                    setTemplateData(templateData)
                    if (templateData) {
                        const { currentFormValues, address } =
                            multiDayTemplateToFormValues(templateData)
                        setCurrentFormValues(currentFormValues)
                        setAddress(address)
                    }
                }
            } catch (error) {
                console.error(
                    `EditMultiDayEventForm.fetchEvent.eventId: `,
                    itemId
                )
                throw error
            }
        }
        fetchEvent()
    }, [itemId])

    if (!eventData && !templateData) return <Loading />

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
        const segmentsTemplate: CIEventSegments[] = []

        values.days?.forEach((day: any) => {
            const baseDate = dayjs(day["event-date-base"]) // Clone the base date for each day

            const startTime: string = baseDate
                .clone()
                .hour(dayjs(day["event-time-base"][0]).hour())
                .minute(dayjs(day["event-time-base"][0]).minute())
                .toISOString()
            const endTime: string = baseDate
                .clone()
                .hour(dayjs(day["event-time-base"][1]).hour())
                .minute(dayjs(day["event-time-base"][1]).minute())
                .toISOString()
            segmentsTemplate.push({
                startTime: startTime,
                endTime: endTime,
                type: day["event-type-base"],
                tags: day["event-tags-base"] || [],
                teachers: formatTeachers(day["event-teachers-base"], teachers),
            })

            // Additional sub-events for each day
            day["segments"]?.forEach((segment: any) => {
                const segmentStartTime: string = baseDate
                    .clone()
                    .hour(dayjs(segment.time[0]).hour())
                    .minute(dayjs(segment.time[0]).minute())
                    .toISOString()
                const segmentEndTime: string = baseDate
                    .clone()
                    .hour(dayjs(segment.time[1]).hour())
                    .minute(dayjs(segment.time[1]).minute())
                    .toISOString()
                segmentsTemplate.push({
                    type: segment.type,
                    tags: segment.tags || [],
                    teachers: formatTeachers(segment.teachers, teachers),
                    startTime: segmentStartTime,
                    endTime: segmentEndTime,
                })
            })
        })

        if (eventData) {
            if (!address || !dates) {
                return
            }

            const submitedEventId =
                editType === EventAction.recycle ? uuidv4() : eventData.id

            const event: CIEvent = {
                start_date: dates[0]
                    .hour(13)
                    .minute(0)
                    .second(0)
                    .format("YYYY-MM-DDTHH:mm:ss"),
                end_date: dates[1]
                    .hour(13)
                    .minute(0)
                    .second(0)
                    .format("YYYY-MM-DDTHH:mm:ss"),
                type: values["main-event-type"],
                id: submitedEventId,
                address: address,
                created_at: eventData.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [{ value: user.user_id, label: user.full_name }],
                links: values["links"] || [],
                price: values["prices"] || [],
                hide: false,
                segments: segmentsTemplate,
                district: values["district"],
                creator_id: user.user_id,
                creator_name: user.full_name,
                source_template_id: eventData.source_template_id,
                is_multi_day: true,
                multi_day_teachers: values["multi-day-teachers"] || [],
            }
            try {
                if (editType === EventAction.recycle) {
                    await cieventsService.createCIEvent(event)
                    closeForm()
                } else {
                    await cieventsService.updateCIEvent(eventData.id, event)
                    closeForm()
                }
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
                throw error
            }
        } else if (templateData) {
            console.log("templateData", templateData)
            const template: CITemplate = {
                type: templateData.type,
                template_id: templateData.template_id,
                address: (address || templateData.address) as IAddress,
                created_at: templateData.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [{ value: user.user_id, label: user.full_name }],
                links: values["links"] || [],
                price: values["prices"] || [],
                segments: [],
                district: values["district"],
                is_multi_day: true,
                multi_day_teachers: values["multi-day-teachers"] || [],
                name: values["template-name"],
                created_by: user.user_id,
            }

            try {
                await templateService.updateTemplate(template)
                closeForm()
            } catch (error) {
                console.error(
                    "EventForm.handleSubmit.updateTemplate.error: ",
                    error
                )
            }
        }
    }

    const submitText =
        editType === EventAction.recycle ? "שיכפול אירוע" : "עדכון אירוע"

    return (
        <>
            <Card className="edit-multi-day-event-form">
                <Form
                    form={form}
                    variant="filled"
                    onFinish={handleSubmit}
                    initialValues={currentFormValues}
                >
                    {isTemplate && (
                        <Form.Item name="template-name" label="שם התבנית">
                            <Input allowClear />
                        </Form.Item>
                    )}
                    <MultiDayFormHead
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        address={address}
                        isTemplate={isTemplate}
                        teachers={teachers}
                    />

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
        </>
    )
}

const eventToFormValues = (event: CIEvent) => {
    const daysMap = new Map<string, any[]>()
    event.segments.forEach((segment) => {
        const startDay = dayjs(segment.startTime).format("YYYY-MM-DD")
        if (!daysMap.has(startDay)) {
            daysMap.set(startDay, [])
        }
        daysMap.get(startDay)!.push({
            "event-date-base": dayjs(segment.startTime),
            "event-type-base": segment.type,
            "event-time-base": [
                dayjs(segment.startTime),
                dayjs(segment.endTime),
            ],
            "event-teachers-base": reverseFormatTeachers(segment.teachers),
            "event-tags-base": segment.tags,
        })
    })

    const days = Array.from(daysMap, ([_, segments]) => {
        const baseEvent = segments[0]
        const otherSegments = segments.slice(1).map((segment) => ({
            type: segment["event-type-base"],
            time: segment["event-time-base"],
            teachers: reverseFormatTeachers(segment["event-teachers-base"]),
            tags: segment["event-tags-base"],
        }))
        return {
            "event-date-base": baseEvent["event-date-base"],
            "event-type-base": baseEvent["event-type-base"],
            "event-time-base": baseEvent["event-time-base"],
            "event-teachers-base": baseEvent["event-teachers-base"],
            "event-tags-base": baseEvent["event-tags-base"],
            segments: otherSegments,
        }
    })
    const currentFormValues = {
        created_at: event.created_at,
        updated_at: dayjs().toISOString(),
        "event-title": event.title,
        "event-description": event.description,
        district: event.district,
        address: event.address,
        "event-date": [dayjs(event.start_date), dayjs(event.end_date)],
        "main-event-type": event.type,
        "event-schedule": event.segments.length > 0,
        links: event.links,
        prices: event.price,
        days: days,
    }
    return { currentFormValues, address: event.address }
}
