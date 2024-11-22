import { useNavigate } from "react-router-dom"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Row from "antd/es/row"
import Col from "antd/es/col"
import Select from "antd/es/select"

import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { SelectOption, tagOptions } from "../../../util/options"
import { EventPayloadType, IAddress, UserType } from "../../../util/interfaces"

import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import EventSegmentsForm from "./EventSegmentsForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import { useTaggableUsersList } from "../../../hooks/useTaggableUsersList"
import { useUser } from "../../../context/UserContext"
import { cieventsService, DBCIEvent } from "../../../supabase/cieventsService"
import {
    CITemplateWithoutId,
    templateService,
} from "../../../supabase/templateService"
import { utilService } from "../../../util/utilService"
import Alert from "antd/es/alert"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import { store } from "../../../Store/store"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const initialValues = {
    "event-dates": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

export default function SingleDayEventForm({
    closeForm,
    isTemplate,
}: {
    closeForm: () => void
    isTemplate?: boolean
}) {
    const [form] = Form.useForm()
    const { teachers, orgs } = useTaggableUsersList({ addSelf: true })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    const navigate = useNavigate()
    const { user } = useUser()
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])
    const [address, setAddress] = useState<IAddress | undefined>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )

    useEffect(() => {
        setTemplateOptions(
            user?.templates
                .filter((template) => !template.is_multi_day)
                .map((template) => ({
                    value: template.template_id,
                    label: template.name,
                })) || []
        )
    }, [user])

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    if (
        user.user_type !== UserType.admin &&
        user.user_type !== UserType.creator &&
        user.user_type !== UserType.org
    ) {
        navigate("/")
    }

    const handleAddressSelect = (place: IGooglePlaceOption | null) => {
        if (!place) {
            setAddress(undefined)
            form.setFieldValue("address", undefined)
            return
        }
        const selectedAddress = {
            label: place.label,
            place_id: place.value.place_id,
        }
        setAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
    }

    const handleDateChange = (date: dayjs.Dayjs) => {
        setEventDate(date)
    }

    const handleEndDateChange = (date: dayjs.Dayjs) => {
        setEndDate(date)
    }

    const clearForm = () => {
        form.resetFields()
        // setSubmitted(false)
        setSourceTemplateId(null)
        handleAddressSelect(null)
    }

    const handleTemplateChange = (value: string) => {
        const template = user?.templates.find((t) => t.template_id === value)
        if (template) {
            const { currentFormValues, address } =
                utilService.singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            setSourceTemplateId(template.template_id)
        } else {
            setSourceTemplateId(null)
        }
    }

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true)
        const baseDate = dayjs(values["event-date"]) // Clone the base date for consistent date manipulation

        const segmentsArray = [
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
                type: values["event-type"],
                tags: values["event-tags"] || [],
                teachers: utilService.formatUsersForCIEvent(
                    values["teachers"],
                    teachers
                ),
            },
        ]

        if (values["segments"]) {
            values["segments"].forEach((segment: any) => {
                segmentsArray.push({
                    type: segment["event-type"],
                    tags: segment["event-tags"] || [],
                    teachers: utilService.formatUsersForCIEvent(
                        segment.teachers,
                        teachers
                    ),
                    startTime: baseDate
                        .clone()
                        .hour(segment["event-time"][0].hour())
                        .minute(segment["event-time"][0].minute())
                        .toISOString(),
                    endTime: baseDate
                        .clone()
                        .hour(segment["event-time"][1].hour())
                        .minute(segment["event-time"][1].minute())
                        .toISOString(),
                })
            })
        }

        if (!address) {
            return
        }

        try {
            if (!isTemplate) {
                const event: DBCIEvent = {
                    is_notified: false,
                    start_date: eventDate
                        .hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss"),
                    end_date: eventDate
                        .hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss"),
                    type: "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: dayjs().toISOString(),
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.user_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: segmentsArray,
                    district: values["district"],
                    user_id: user.user_id,
                    source_template_id: sourceTemplateId,
                    is_multi_day: false,
                    multi_day_teachers: null,
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            orgs
                        ) || [],
                    cancelled: false,
                }
                const newEvent = await cieventsService.createCIEvent(event)
                store.setCIEvent(newEvent, EventPayloadType.INSERT)
                clearForm()
                closeForm()
            } else {
                const template: CITemplateWithoutId = {
                    type: "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: null,
                    name: values["template-name"],
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.user_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: segmentsArray,
                    district: values["district"],
                    is_multi_day: false,
                    multi_day_teachers: [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            orgs
                        ) || [],
                }
                // setSubmitted(true)
                await templateService.createTemplate(template)
                clearForm()
                closeForm()
            }
        } catch (error) {
            console.error("EventForm.handleSubmit.error: ", error)
            throw error
        } finally {
            setIsSubmitting(false)
        }
    }

    const onFinishFailed = () => {
        setInputErrors(true)
    }

    const titleText = isTemplate
        ? "יצירת תבנית חד יומית"
        : "הוספת אירוע חד יומי"

    return (
        <div className="single-day-event-form">
            <section className="event-card">
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    onFinishFailed={onFinishFailed}
                    variant="filled"
                    initialValues={initialValues}
                >
                    {isTemplate && (
                        <Form.Item name="template-name">
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Form.Item name="template-name">
                                        <Input
                                            placeholder="שם התבנית"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn"
                                    >
                                        ניקוי טופס
                                    </button>
                                </Col>
                            </Row>
                        </Form.Item>
                    )}
                    {!isTemplate && (
                        <Form.Item>
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Form.Item name="template-description">
                                        <Select
                                            options={templateOptions}
                                            onChange={handleTemplateChange}
                                            allowClear
                                            placeholder="בחירת תבנית"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn"
                                    >
                                        ניקוי טופס
                                    </button>
                                </Col>
                            </Row>
                        </Form.Item>
                    )}
                    <SingleDayEventFormHead
                        form={form}
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        handleEndDateChange={handleEndDateChange}
                        address={address}
                        eventDate={eventDate}
                        endDate={endDate}
                        isEdit={false}
                        teachers={teachers}
                        isTemplate={isTemplate}
                        titleText={titleText}
                        orgs={orgs}
                    />
                    <EventSegmentsForm form={form} teachers={teachers} />
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
                            {isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                        </AsyncFormSubmitButton>
                    </Form.Item>
                </Form>
            </section>
        </div>
    )
}
