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
import { CITemplate, DBCIEvent, IAddress } from "../../../util/interfaces"

import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import EventSegmentsForm from "./EventSegmentsForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
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
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [eventDate, setEventDate] = useState(dayjs())
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])
    const [address, setAddress] = useState<IAddress | undefined>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )

    useEffect(() => {
        setTemplateOptions(
            store.getTemplates
                .filter((template) => !template.is_multi_day)
                .map((template) => ({
                    value: template.id,
                    label: template.name,
                })) || []
        )
    }, [store.getTemplates])

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
        const template = store.getTemplates.find((t) => t.id === value)
        if (template) {
            const { currentFormValues, address } =
                utilService.singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            setSourceTemplateId(template.id)
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
                    .hour(values["first-segment-start-time"].hour())
                    .minute(values["first-segment-start-time"].minute())
                    .toISOString(),
                endTime: baseDate
                    .clone()
                    .hour(values["first-segment-end-time"].hour())
                    .minute(values["first-segment-end-time"].minute())
                    .toISOString(),
                type: values["event-type"],
                tags: values["event-tags"] || [],
                teachers: utilService.formatUsersForCIEvent(
                    values["teachers"],
                    store.getAppTaggableTeachers
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
                        store.getAppTaggableTeachers
                    ),
                    startTime: baseDate
                        .clone()
                        .hour(segment["event-start-time"].hour())
                        .minute(segment["event-start-time"].minute())
                        .toISOString(),
                    endTime: baseDate
                        .clone()
                        .hour(segment["event-end-time"].hour())
                        .minute(segment["event-end-time"].minute())
                        .toISOString(),
                })
            })
        }

        if (!address) {
            return
        }

        try {
            if (!isTemplate) {
                const event: Omit<DBCIEvent, "id"> = {
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
                    owners: [
                        {
                            value: store.getUser.user_id,
                            label: store.getUser.user_name,
                        },
                    ],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: segmentsArray,
                    district: values["district"],
                    user_id: store.getUser.user_id,
                    source_template_id: sourceTemplateId,
                    is_multi_day: false,
                    multi_day_teachers: null,
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            store.getAppTaggableOrgs
                        ) || [],
                    cancelled: false,
                }
                await store.createCIEvent(event)
                clearForm()
                closeForm()
            } else {
                const template: Omit<CITemplate, "id"> = {
                    type: "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: null,
                    name: values["template-name"],
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [
                        {
                            value: store.getUser.user_id,
                            label: store.getUser.user_name,
                        },
                    ],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: segmentsArray,
                    district: values["district"],
                    is_multi_day: false,
                    multi_day_teachers: [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            store.getAppTaggableOrgs
                        ) || [],
                    user_id: store.getUser.user_id,
                }
                await store.createTemplate(template)
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
        setTimeout(() => {
            setInputErrors(false)
        }, 3000)
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
                                            size="large"
                                            className="form-input-large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn large-btn"
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
                                            size="large"
                                            className="form-input-large"
                                            popupClassName="form-input-large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <button
                                        type="button"
                                        onClick={() => clearForm()}
                                        className="general-clear-btn large-btn"
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
                        teachers={store.getAppTaggableTeachers}
                        isTemplate={isTemplate}
                        titleText={titleText}
                        orgs={store.getAppTaggableOrgs}
                    />
                    <EventSegmentsForm
                        form={form}
                        teachers={store.getAppTaggableTeachers}
                    />
                    <hr className="divider" />
                    <label className="segment-title">
                        קישור{" "}
                        <span className="segment-description">
                            (יופיע ככפתור בעמוד האירוע)
                        </span>
                    </label>
                    <AddLinksForm />
                    <hr className="divider" />
                    <label className="segment-title">מחיר</label>
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
                        <AsyncFormSubmitButton
                            isSubmitting={isSubmitting}
                            size="large"
                        >
                            {isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                        </AsyncFormSubmitButton>
                    </Form.Item>
                </Form>
            </section>
        </div>
    )
}
