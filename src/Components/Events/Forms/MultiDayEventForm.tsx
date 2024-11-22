import { useNavigate } from "react-router-dom"
import Form from "antd/es/form"
import Input from "antd/es/input"
import Row from "antd/es/row"
import Col from "antd/es/col"
import Select from "antd/es/select"
import customParseFormat from "dayjs/plugin/customParseFormat"
// import "../../../styles/overrides.css"

import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { eventOptions, SelectOption, tagOptions } from "../../../util/options"
import { EventPayloadType, IAddress, UserType } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import { useTaggableUsersList } from "../../../hooks/useTaggableUsersList"

import { useUser } from "../../../context/UserContext"
import { cieventsService, DBCIEvent } from "../../../supabase/cieventsService"

import Alert from "antd/es/alert"
import {
    CITemplateWithoutId,
    templateService,
} from "../../../supabase/templateService"
import { utilService } from "../../../util/utilService"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import AddPricesForm from "./AddPricesForm"
import MultiDayFormHead from "./MultiDayFormHead"
import { store } from "../../../Store/store"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const initialValues = {
    "event-dates": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

export default function MultiDayEventForm({
    closeForm,
    isTemplate,
}: {
    closeForm: () => void
    isTemplate: boolean
}) {
    const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)
    const navigate = useNavigate()
    const { teachers, orgs } = useTaggableUsersList({ addSelf: true })

    const { user } = useUser()
    const [address, setAddress] = useState<IAddress>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])

    useEffect(() => {
        const newTemplateOptions = user?.templates
            .filter((template) => template.is_multi_day)
            .map((template) => ({
                value: template.id,
                label: template.name,
            }))
        setTemplateOptions(newTemplateOptions || [])
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

    const [form] = Form.useForm()

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

    const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
        setDates(dates)
    }

    const clearForm = () => {
        form.resetFields()
        // setSubmitted(false)
        setSourceTemplateId(null)
        handleAddressSelect(null)
    }

    const handleTemplateChange = (value: string) => {
        const template = user?.templates.find((t) => t.id === value)
        if (template) {
            const { currentFormValues, address } = template.is_multi_day
                ? utilService.multiDayTemplateToFormValues(template)
                : utilService.singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            setSourceTemplateId(template.id)
        } else {
            setSourceTemplateId(null)
        }
    }

    const handleSubmit = async (values: any) => {
        if (!address) {
            return
        }
        setIsSubmitting(true)
        try {
            if (!isTemplate) {
                if (!dates) {
                    throw new Error("dates are null")
                }
                const event: DBCIEvent = {
                    is_notified: false,
                    cancelled: false,
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
                    type:
                        eventOptions.find(
                            (type) => type.label === values["main-event-type"]
                        )?.value || "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: dayjs().toISOString(),
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.user_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: [],
                    district: values["district"],
                    user_id: user.user_id,
                    source_template_id: sourceTemplateId,
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatUsersForCIEvent(
                            values["multi-day-event-teachers"],
                            teachers
                        ) || [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            orgs
                        ) || [],
                }
                // console.log("values: ", values)
                // console.log("event: ", event)
                const newEvent = await cieventsService.createCIEvent(event)
                store.setCIEvent(newEvent, EventPayloadType.INSERT)
                clearForm()
                closeForm()
            } else {
                const template: CITemplateWithoutId = {
                    type: values["main-event-type"],
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: null,
                    name: values["template-name"],
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.user_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: [],
                    district: values["district"],
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatUsersForCIEvent(
                            values["multi-day-event-teachers"],
                            teachers
                        ) || [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"],
                            orgs
                        ) || [],
                }
                // setSubmitted(true)
                const newTemplate = await templateService.createTemplate(
                    template
                )
                store.setTemplate(newTemplate, EventPayloadType.INSERT)
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

    return (
        <>
            <section className="multi-day-event-form">
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    variant="filled"
                    initialValues={initialValues}
                    onFinishFailed={onFinishFailed}
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
                                            key={templateOptions.length}
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
                    <MultiDayFormHead
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        isTemplate={isTemplate}
                        address={address}
                        teachers={teachers}
                        orgs={orgs}
                        titleText="יצירת אירוע - רב יומי"
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
        </>
    )
}
