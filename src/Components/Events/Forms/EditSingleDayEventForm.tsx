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
    CITemplate,
    DBCIEvent,
} from "../../../util/interfaces"

import Loading from "../../Common/Loading"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import EventSegmentsForm from "./EventSegmentsForm"
import { EventAction } from "../../../App"
import { utilService } from "../../../util/utilService"
import Alert from "antd/es/alert"
import { store } from "../../../Store/store"
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
    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    const [form] = Form.useForm()

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

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true)
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
                teachers: utilService.formatUsersForCIEvent(
                    values["teachers"],
                    store.getAppTaggableTeachers
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
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers,
                        store.getAppTaggableTeachers
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
            editType === EventAction.recycle ? uuidv4() : event.id
            const updatedEvent: DBCIEvent = {
                id: event.id,
                is_notified: event.is_notified,
                cancelled: event.cancelled,
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
                address: (newAddress || address) as IAddress,
                created_at: event.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [
                    {
                        value: store.user.user_id,
                        label: store.user.user_name,
                    },
                ],
                links: values["links"] || [],
                price: values["prices"] || [],
                hide: false,
                segments: segments,
                district: values["district"],
                user_id: store.user.user_id,
                source_template_id: event.source_template_id,
                is_multi_day: false,
                multi_day_teachers: [],
                organisations:
                    utilService.formatUsersForCIEvent(
                        values["event-orgs"],
                        store.getAppTaggableOrgs
                    ) || [],
            }
            try {
                await store.updateCIEvent({
                    ...updatedEvent,
                    id: event.id,
                })
                closeForm()
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
            } finally {
                setIsSubmitting(false)
            }
        } else if (template) {
            const updatedTemplate: CITemplate = {
                type: "",
                id: template.id,
                address: (newAddress || address) as IAddress,
                created_at: template.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [
                    { value: store.user.user_id, label: store.user.user_name },
                ],
                links: values["links"] || [],
                price: values["prices"] || [],
                segments: segments,
                district: values["district"],
                is_multi_day: false,
                multi_day_teachers: [],
                name: values["template-name"],
                user_id: store.user.user_id,
                organisations:
                    utilService.formatUsersForCIEvent(
                        values["event-orgs"],
                        store.getAppTaggableOrgs
                    ) || [],
            }
            console.log(
                "EditSingleDayEventForm.handleSubmit.updatedTemplate: ",
                updatedTemplate
            )
            try {
                await store.updateTemplate(updatedTemplate)
                closeForm()
            } catch (error) {
                console.error(
                    "EventForm.handleSubmit.updateTemplate.error: ",
                    error
                )
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const onFinishFailed = () => {
        setInputErrors(true)
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
                    onFinishFailed={onFinishFailed}
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
                        teachers={store.getAppTaggableTeachers}
                        address={address || ({} as IAddress)}
                        titleText={titleText}
                        isTemplate={isTemplate}
                        orgs={store.getAppTaggableOrgs}
                    />
                    <EventSegmentsForm
                        form={form}
                        teachers={store.getAppTaggableTeachers}
                    />
                    <AddLinksForm />
                    <AddPricesForm />
                    {inputErrors && (
                        <Alert
                            message="ערכים שגויים, נא לבדוק את הטופס"
                            type="error"
                            style={{ margin: "10px 0" }}
                        />
                    )}
                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <AsyncFormSubmitButton isSubmitting={isSubmitting}>
                            {submitText}
                        </AsyncFormSubmitButton>
                    </Form.Item>
                </Form>
            </Card>
            <div className="footer-space"></div>
        </>
    )
}
