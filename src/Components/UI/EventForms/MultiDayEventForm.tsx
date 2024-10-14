import { useNavigate } from "react-router-dom"
import { Col, Form, Input, Row, Select } from "antd"
import customParseFormat from "dayjs/plugin/customParseFormat"
import "../../../styles/overrides.css"

import dayjs, { Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { eventTypes, SelectOption, tagOptions } from "../../../util/options"
import { IAddress, UserType } from "../../../util/interfaces"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useEffect, useState } from "react"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import MultiDayFormHead from "./MultiDayFormHead"
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

export default function MultiDayEventForm({
    closeForm,
    isTemplate,
}: {
    closeForm: () => void
    isTemplate: boolean
}) {
    const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null)
    const navigate = useNavigate()
    const { teachers } = useTeachersList({ addSelf: true })
    const templates = useTemplates({ isMultiDay: true })

    const { user } = useUser()
    const [address, setAddress] = useState<IAddress>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )
    const [templateOptions, setTemplateOptions] = useState<SelectOption[]>([])

    useEffect(() => {
        const newTemplateOptions = templates.map((template) => ({
            value: template.template_id,
            label: template.name,
        }))
        setTemplateOptions(newTemplateOptions)
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
        const template = templates.find((t) => t.template_id === value)
        if (template) {
            const { currentFormValues, address } = template.is_multi_day
                ? utilService.multiDayTemplateToFormValues(template)
                : utilService.singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            setSourceTemplateId(template.template_id)
        } else {
            setSourceTemplateId(null)
        }
    }

    const handleSubmit = async (values: any) => {
        if (!address) {
            return
        }

        try {
            if (!isTemplate) {
                if (!dates) {
                    throw new Error("dates are null")
                }
                const event: CIEventWithoutId = {
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
                        eventTypes.find(
                            (type) => type.label === values["main-event-type"]
                        )?.value || "",
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: dayjs().toISOString(),
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: [],
                    district: values["district"],
                    creator_id: user.user_id,
                    creator_name: user.full_name,
                    source_template_id: sourceTemplateId,
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatTeachersForCIEvent(
                            values["multi-day-event-teachers"],
                            teachers
                        ) || [],
                }
                await cieventsService.createCIEvent(event)
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
                    owners: [{ value: user.user_id, label: user.full_name }],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: [],
                    district: values["district"],
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatTeachersForCIEvent(
                            values["multi-day-event-teachers"],
                            teachers
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
        }
    }

    return (
        <>
            <section className="multi-day-event-form">
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

                    <Form.Item
                        wrapperCol={{ span: 24 }}
                        className="submit-button-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                        }}
                    >
                        <button type="submit" className="general-action-btn">
                            {isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                        </button>
                    </Form.Item>
                </Form>
            </section>
        </>
    )
}
