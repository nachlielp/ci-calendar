import Form from "antd/es/form"
import Input from "antd/es/input"
import Row from "antd/es/row"
import Col from "antd/es/col"
import Select from "antd/es/select"
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { eventOptions, tagOptions } from "../../../util/options"
import { CITemplate, DBCIEvent, IAddress } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import { utilService } from "../../../util/utilService"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import MultiDayFormHead from "./MultiDayFormHead"
import { store } from "../../../Store/store"
import EventFromFooter from "./EventFromFooter"
import "../../../styles/event-form.css"
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const initialValues = {
    "event-dates": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

const DRAFT_EVENT_KEY = "multi-day-draft-event"
const DRAFT_EVENT_ADDRESS_KEY = "multi-day-draft-event-address"

const DRAFT_TEMPLATE_KEY = "multi-day-draft-template"
const DRAFT_TEMPLATE_ADDRESS_KEY = "multi-day-draft-template-address"

export default function MultiDayEventForm({
    closeForm,
    isTemplate,
}: {
    closeForm: () => void
    isTemplate: boolean
}) {
    const DRAFT_KEY = isTemplate ? DRAFT_TEMPLATE_KEY : DRAFT_EVENT_KEY
    const DRAFT_ADDRESS_KEY = isTemplate
        ? DRAFT_TEMPLATE_ADDRESS_KEY
        : DRAFT_EVENT_ADDRESS_KEY

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    const [address, setAddress] = useState<IAddress>()
    const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
        null
    )

    const [form] = Form.useForm()

    useEffect(() => {
        if (isTemplate) {
        }
        const addressObj = utilService.getDraftEvent(DRAFT_ADDRESS_KEY)
        let currentAddress: IAddress | undefined = undefined

        if (addressObj?.address) {
            currentAddress = addressObj.address
            setAddress(currentAddress)
        }

        const currentFormValuesObj = utilService.getDraftEvent(DRAFT_KEY)
        if (currentFormValuesObj) {
            const { currentFormValues } =
                utilService.CIEventDraftToFormValues(currentFormValuesObj)
            form.setFieldsValue({
                ...currentFormValues,
                address: currentAddress,
            })
        } else {
            form.setFieldsValue({
                ...initialValues,
                address: currentAddress,
            })
        }
    }, [])

    const onFormValueChange = (_: any, allFields: any) => {
        const draftEvent = utilService.formatFormValuesToDraftCIEvent(
            allFields,
            address,
            false
        )
        utilService.saveDraftEvent(draftEvent, DRAFT_KEY)
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
        utilService.saveDraftEvent(
            { address: selectedAddress },
            DRAFT_ADDRESS_KEY
        )
        form.setFieldValue("address", selectedAddress)
    }

    const clearForm = () => {
        form.resetFields()
        // setSubmitted(false)
        setSourceTemplateId(null)
        handleAddressSelect(null)
        utilService.clearDraftEvent(DRAFT_KEY)
        utilService.clearDraftEvent(DRAFT_ADDRESS_KEY)
    }

    const handleTemplateChange = (value: string) => {
        const template = store.getTemplates.find((t) => t.id === value)
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
                const event: Omit<DBCIEvent, "id" | "cancelled_text"> = {
                    is_notified: false,
                    cancelled: false,
                    start_date: dayjs(values["event-start-date"])
                        .hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss"),
                    end_date: dayjs(values["event-end-date"])
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
                    owners: [
                        {
                            value: store.user.id,
                            label: store.user.user_name,
                        },
                    ],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    hide: false,
                    segments: [],
                    district: values["district"],
                    user_id: store.user.id,
                    source_template_id: sourceTemplateId,
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatUsersForCIEvent(
                            values["multi-day-event-teachers"]
                        ) || [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"]
                        ) || [],
                }

                await store.createCIEvent(event)
                clearForm()
                closeForm()
            } else {
                const template: Omit<CITemplate, "id"> = {
                    type: values["main-event-type"],
                    address: address,
                    created_at: dayjs().toISOString(),
                    updated_at: null,
                    name: values["template-name"],
                    title: values["event-title"],
                    description: values["event-description"] || "",
                    owners: [
                        {
                            value: store.user.id,
                            label: store.user.user_name,
                        },
                    ],
                    links: values["links"] || [],
                    price: values["prices"] || [],
                    segments: [],
                    district: values["district"],
                    is_multi_day: true,
                    multi_day_teachers:
                        utilService.formatUsersForCIEvent(
                            values["multi-day-event-teachers"]
                        ) || [],
                    organisations:
                        utilService.formatUsersForCIEvent(
                            values["event-orgs"]
                        ) || [],
                    user_id: store.user.id,
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

    return (
        <section className="event-form">
            <Form
                form={form}
                onFinish={handleSubmit}
                variant="filled"
                // initialValues={initialValues}
                onFinishFailed={onFinishFailed}
                onValuesChange={onFormValueChange}
            >
                {isTemplate && (
                    <Form.Item name="template-name">
                        <Row gutter={8}>
                            <Col span={16}>
                                <Form.Item
                                    name="template-name"
                                    rules={[
                                        { required: true, message: "שדה חובה" },
                                    ]}
                                >
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
                                        key={
                                            store.getMultiDayTemplateOptions
                                                .length
                                        }
                                        options={
                                            store.getMultiDayTemplateOptions
                                        }
                                        onChange={handleTemplateChange}
                                        allowClear
                                        placeholder="בחירת תבנית"
                                        size="large"
                                        className="form-input-large"
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? "")
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
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
                <MultiDayFormHead
                    form={form}
                    handleAddressSelect={handleAddressSelect}
                    isTemplate={isTemplate}
                    address={address}
                    teachers={store.getAppTaggableTeachers}
                    orgs={store.getAppTaggableOrgs}
                    titleText="יצירת אירוע - רב יומי"
                />
                <EventFromFooter
                    isSubmitting={isSubmitting}
                    inputErrors={inputErrors}
                    submitText={isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                />
            </Form>
        </section>
    )
}
