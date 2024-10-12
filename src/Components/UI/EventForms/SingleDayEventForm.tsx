import { useNavigate } from "react-router-dom"
import { Col, Form, Input, Row, Select } from "antd"
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { SelectOption, tagOptions } from "../../../util/options"
import { IAddress, UserType } from "../../../util/interfaces"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import EventSegmentsForm from "./EventSegmentsForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { useUser } from "../../../context/UserContext"
import {
    cieventsService,
    CIEventWithoutId,
} from "../../../supabase/cieventsService"
import {
    CITemplateWithoutId,
    templateService,
} from "../../../supabase/templateService"
import { utilService } from "../../../util/utilService"
import useTemplates from "../../../hooks/useTemplates"

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
    const { teachers } = useTeachersList()
    // const [repeatOption, setRepeatOption] = useState<EventFrequency>(
    //     EventFrequency.none
    // )
    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    // const [submitted, setSubmitted] = useState(false)
    const navigate = useNavigate()
    const { user } = useUser()
    const templates = useTemplates({ isMultiDay: false })
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])
    const [address, setAddress] = useState<IAddress | undefined>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )

    useEffect(() => {
        setTemplateOptions(
            templates.map((template) => ({
                value: template.template_id,
                label: template.name,
            }))
        )
    }, [templates])

    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }

    if (
        user.user_type !== UserType.admin &&
        user.user_type !== UserType.creator
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
        const template = templates.find((t) => t.template_id === value)
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
                teachers: utilService.formatTeachersForCIEvent(
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
                    teachers: utilService.formatTeachersForCIEvent(
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
                const event: CIEventWithoutId = {
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
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: segmentsArray,
                    district: values["district"],
                    creator_id: user.user_id,
                    creator_name: user.full_name,
                    source_template_id: sourceTemplateId,
                    is_multi_day: false,
                    multi_day_teachers: null,
                }
                // setSubmitted(true)
                await cieventsService.createCIEvent(event)
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
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: segmentsArray,
                    district: values["district"],
                    is_multi_day: false,
                    multi_day_teachers: null,
                }
                // setSubmitted(true)
                await templateService.createTemplate(template)
                clearForm()
                closeForm()
            }
        } catch (error) {
            console.error("EventForm.handleSubmit.error: ", error)
            throw error
        }
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

                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <button type="submit" className={`general-action-btn`}>
                            <label>
                                {isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                            </label>
                            {/* <Spin percent="auto" spinning={submitted} /> */}
                        </button>
                    </Form.Item>
                </Form>
            </section>
        </div>
    )
}
