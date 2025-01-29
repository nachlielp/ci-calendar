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
import "../../../styles/event-form.scss"
import Select from "antd/es/select"
import { v4 as uuidv4 } from "uuid"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import RecurringEventSection from "./RecurringEventSection"
import { observer } from "mobx-react-lite"

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

const DRAFT_TEMPLATE_KEY = "single-day-draft-template"
const DRAFT_TEMPLATE_ADDRESS_KEY = "single-day-draft-template-address"

interface SingleDayEventFormProps {
    closeForm: () => void
    isTemplate?: boolean
}

const SingleDayEventForm = observer(
    ({ closeForm, isTemplate }: SingleDayEventFormProps) => {
        const DRAFT_KEY = isTemplate ? DRAFT_TEMPLATE_KEY : DRAFT_EVENT_KEY
        const DRAFT_ADDRESS_KEY = isTemplate
            ? DRAFT_TEMPLATE_ADDRESS_KEY
            : DRAFT_EVENT_ADDRESS_KEY

        const [form] = Form.useForm()
        const [isSubmitting, setIsSubmitting] = useState(false)

        const [eventDate, setEventDate] = useState(dayjs())
        const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)
        const [inputErrors, setInputErrors] = useState<boolean>(false)
        const [address, setAddress] = useState<IAddress | undefined>()
        const [recurringOption, setRecurringOption] = useState<string | null>(
            null
        )
        const [recurringEndDate, setRecurringEndDate] =
            useState<dayjs.Dayjs | null>(null)

        useEffect(() => {
            if (isTemplate) {
                const currentFormValuesObj =
                    utilService.getDraftEvent(DRAFT_KEY)
                if (currentFormValuesObj) {
                    const { currentFormValues } =
                        utilService.CIEventDraftToFormValues(
                            currentFormValuesObj
                        )
                    form.setFieldsValue({
                        ...currentFormValues,
                    })
                }
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

        useEffect(() => {
            onFormValueChange(null, form.getFieldsValue())
        }, [eventDate, endDate])

        const onFormValueChange = (_: any, allFields: any) => {
            const updatedFields = {
                ...allFields,
                "event-start-date": allFields["event-start-date"] || eventDate,
                "event-end-date": allFields["event-end-date"] || endDate,
            }

            const draftEvent = utilService.formatFormValuesToDraftCIEvent(
                updatedFields,
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

        const handleDateChange = (date: dayjs.Dayjs) => {
            setEventDate(date)
        }

        const handleEndDateChange = (date: dayjs.Dayjs) => {
            setEndDate(date)
        }

        const handleRecurringOptionChange = (value: string) => {
            setRecurringOption(value)
        }

        const handleRecurringEndDateChange = (date: dayjs.Dayjs) => {
            setRecurringEndDate(date)
        }

        const clearForm = () => {
            form.resetFields()
            handleAddressSelect(null)
            utilService.clearDraftEvent(DRAFT_KEY)
            utilService.clearDraftEvent(DRAFT_ADDRESS_KEY)
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
                    DRAFT_ADDRESS_KEY
                )
                onFormValueChange(currentFormValues, form.getFieldsValue())
            }
        }

        const handleSubmit = async (values: any) => {
            console.log("handleSubmit", values)
            if (!address) {
                return
            }

            setIsSubmitting(true)
            try {
                if (!isTemplate) {
                    if (!values["recurring-event"]) {
                        const event: Omit<
                            DBCIEvent,
                            "id" | "cancelled_text" | "short_id"
                        > = utilService.formatFormValuesToCreateCIEvent(
                            values,
                            address,
                            false
                        )
                        await store.createCIEvent(event)
                    } else {
                        const recurring_ref_key = uuidv4()
                        const event: Omit<
                            DBCIEvent,
                            "id" | "cancelled_text" | "short_id"
                        > = utilService.formatFormValuesToCreateCIEvent(
                            values,
                            address,
                            false
                        )

                        if (
                            eventDate &&
                            values["recurring-event-end-date"] &&
                            values["recurring-event-option"]
                        ) {
                            const startDate = eventDate
                            const recurringEndDate = dayjs(
                                values["recurring-event-end-date"]
                            )
                            const recurringOption =
                                values["recurring-event-option"]
                            const recurringEventStartDates =
                                utilService.calculateRecurringEventDates(
                                    startDate,
                                    recurringEndDate,
                                    recurringOption
                                )
                            const recurringEvents =
                                recurringEventStartDates.map((date) => {
                                    return utilService.duplicateEvent(
                                        date,
                                        event,
                                        false
                                    )
                                })
                            Promise.all(
                                recurringEvents.map((event) =>
                                    store.createCIEvent({
                                        ...event,
                                        recurring_ref_key,
                                    })
                                )
                            )
                        }
                    }
                } else {
                    const template: Omit<CITemplate, "id"> =
                        utilService.formatFormValuesToCreateCITemplate(
                            values,
                            address,
                            false
                        )
                    await store.createTemplate(template)
                }
                clearForm()
                closeForm()
                utilService.clearDraftEvent(DRAFT_KEY)
                utilService.clearDraftEvent(DRAFT_ADDRESS_KEY)
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
            }, 5000)
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
                        // initialValues={currentFormValues}
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
                            address={address}
                            isEdit={false}
                            teachers={store.getAppTaggableTeachers}
                            isTemplate={isTemplate}
                            titleText={titleText}
                            orgs={store.getAppTaggableOrgs}
                            handleDateChange={handleDateChange}
                            handleEndDateChange={handleEndDateChange}
                            eventDate={eventDate}
                            endDate={endDate}
                        />
                        <EventSegmentsForm
                            form={form}
                            teachers={store.getAppTaggableTeachers}
                        />
                        <EventFromFooter inputErrors={inputErrors} />
                        {!isTemplate && (
                            <RecurringEventSection
                                startDate={eventDate}
                                endDate={endDate}
                                form={form}
                                recurringOption={recurringOption}
                                recurringEndDate={recurringEndDate}
                                handleRecurringOptionChange={
                                    handleRecurringOptionChange
                                }
                                handleRecurringEndDateChange={
                                    handleRecurringEndDateChange
                                }
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
)

SingleDayEventForm.displayName = "SingleDayEventForm"

export default SingleDayEventForm
