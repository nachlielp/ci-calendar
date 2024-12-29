import Form from "antd/es/form"
import Input from "antd/es/input"
import Row from "antd/es/row"
import Col from "antd/es/col"
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { tagOptions } from "../../../util/options"
import { CITemplate, DBCIEvent, IAddress } from "../../../util/interfaces"
import { useEffect, useState } from "react"
import EventSegmentsForm from "./EventSegmentsForm"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import { utilService } from "../../../util/utilService"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import { store } from "../../../Store/store"
import EventFromFooter from "./EventFromFooter"
import "../../../styles/event-form.css"
import Select from "antd/es/select"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.tz.setDefault("Asia/Jerusalem")

const initialValues = {
    "event-dates": dayjs.tz(dayjs(), "Asia/Jerusalem"),
    "event-tags": [tagOptions[0].value],
}

const DRAFT_EVENT_KEY = "single-day-draft-event"
const DRAFT_EVENT_ADDRESS_KEY = "single-day-draft-event-address"

// const DRAFT_TEMPLATE_KEY = "single-day-draft-template"
// const DRAFT_TEMPLATE_ADDRESS_KEY = "single-day-draft-template-address"

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
    const [address, setAddress] = useState<IAddress | undefined>()

    useEffect(() => {
        const { address } = utilService.getDraftEvent(DRAFT_EVENT_ADDRESS_KEY)
        if (address) {
            setAddress(address)
        }
    }, [])

    const { currentFormValues } = utilService.getDraftEvent(DRAFT_EVENT_KEY)
        ? utilService.CIEventDraftToFormValues(
              utilService.getDraftEvent(DRAFT_EVENT_KEY)
          )
        : { currentFormValues: initialValues }

    const onFormValueChange = (_: any, allFields: any) => {
        const draftEvent = utilService.formatFormValuesToDraftCIEvent(
            allFields,
            address,
            false
        )
        utilService.saveDraftEvent(draftEvent, DRAFT_EVENT_KEY)
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
            DRAFT_EVENT_ADDRESS_KEY
        )
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
        handleAddressSelect(null)
    }

    const handleTemplateChange = (value: string) => {
        const template = store.getTemplates.find((t) => t.id === value)
        if (template) {
            const { currentFormValues, address } =
                utilService.singleDayTemplateToFormValues(template)
            form.setFieldsValue(currentFormValues)
            setAddress(address)
            utilService.saveDraftEvent(
                { address: address },
                DRAFT_EVENT_ADDRESS_KEY
            )
            onFormValueChange(currentFormValues, form.getFieldsValue())
        }
    }

    const handleSubmit = async (values: any) => {
        if (!address) {
            return
        }
        setIsSubmitting(true)
        try {
            if (!isTemplate) {
                const event: Omit<DBCIEvent, "id" | "cancelled_text"> =
                    utilService.formatFormValuesToCreateCIEvent(
                        values,
                        address,
                        false
                    )
                await store.createCIEvent(event)
                clearForm()
                closeForm()
                utilService.clearDraftEvent(DRAFT_EVENT_KEY)
                utilService.clearDraftEvent(DRAFT_EVENT_ADDRESS_KEY)
            } else {
                const template: Omit<CITemplate, "id"> =
                    utilService.formatFormValuesToCreateCITemplate(
                        values,
                        address,
                        false
                    )
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
        <div className="event-form">
            <section className="event-card">
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    onFinishFailed={onFinishFailed}
                    variant="filled"
                    initialValues={currentFormValues}
                    onValuesChange={onFormValueChange}
                >
                    {isTemplate && (
                        <Form.Item name="template-name">
                            <Row gutter={8}>
                                <Col span={16}>
                                    <Form.Item
                                        name="template-name"
                                        rules={[
                                            {
                                                required: true,
                                                message: "שדה חובה",
                                            },
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
                                            options={
                                                store.getSingleDayTemplateOptions
                                            }
                                            onChange={handleTemplateChange}
                                            allowClear
                                            placeholder="בחירת תבנית"
                                            size="large"
                                            popupClassName="form-input-large"
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? "")
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase()
                                                    )
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
                    <EventFromFooter
                        isSubmitting={isSubmitting}
                        inputErrors={inputErrors}
                        submitText={isTemplate ? "יצירת תבנית" : "יצירת אירוע"}
                    />
                </Form>
            </section>
        </div>
    )
}
