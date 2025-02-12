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
import "../../../styles/event-form.scss"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import { observer } from "mobx-react-lite"
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

const ERROR_MESSAGE_TOO_LONG = "אירוע לא יכול להמשך מעל ל-14 ימים"
const ERROR_MESSAGE_START_DATE_AFTER_END_DATE =
    "אירוע רב יומי לא יכול להתחיל ולהסתיים באותו יום, בשביל זה יש אירוע חד יומי"
const MultiDayEventForm = observer(
    ({
        closeForm,
        isTemplate,
    }: {
        closeForm: () => void
        isTemplate: boolean
    }) => {
        const DRAFT_KEY = isTemplate ? DRAFT_TEMPLATE_KEY : DRAFT_EVENT_KEY
        const DRAFT_ADDRESS_KEY = isTemplate
            ? DRAFT_TEMPLATE_ADDRESS_KEY
            : DRAFT_EVENT_ADDRESS_KEY

        const [isSubmitting, setIsSubmitting] = useState(false)
        const [inputErrors, setInputErrors] = useState<boolean>(false)
        const [errorMessage, setErrorMessage] = useState<string | null>(null)

        const [address, setAddress] = useState<IAddress>()
        const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(
            null
        )

        const [form] = Form.useForm()

        useEffect(() => {
            if (isTemplate) {
                const template = store.getTemplates.find(
                    (t) => t.id === sourceTemplateId
                )
                if (template) {
                    const { currentFormValues, address } = template.is_multi_day
                        ? utilService.multiDayTemplateToFormValues(template)
                        : utilService.singleDayTemplateToFormValues(template)
                    form.setFieldsValue(currentFormValues)
                    setAddress(address)
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
                setErrorMessage("שדה חובה")
                console.log("address is required")
                return
            }

            if (
                dayjs(values["event-start-date"]).isSame(
                    dayjs(values["event-end-date"]),
                    "day"
                )
            ) {
                setErrorMessage(ERROR_MESSAGE_START_DATE_AFTER_END_DATE)
                setTimeout(() => {
                    onFinishFailed(), 0
                })
                console.log("start date is same as end date")
                return
            }

            if (
                dayjs(values["event-end-date"]).diff(
                    dayjs(values["event-start-date"]),
                    "days"
                ) > 14
            ) {
                setErrorMessage(ERROR_MESSAGE_TOO_LONG)
                setTimeout(() => {
                    onFinishFailed(), 0
                })
                console.log("too long")
                return
            }

            setIsSubmitting(true)
            try {
                if (!isTemplate) {
                    const event: Omit<
                        DBCIEvent,
                        "id" | "cancelled_text" | "short_id"
                    > = {
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
                                (type) =>
                                    type.label === values["main-event-type"]
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
                }
                utilService.clearDraftEvent(DRAFT_KEY)
                utilService.clearDraftEvent(DRAFT_ADDRESS_KEY)
                clearForm()
                closeForm()
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
                setErrorMessage(null)
            }, 10000)
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
                        inputErrors={inputErrors}
                        message={errorMessage}
                    />
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
        )
    }
)

export default MultiDayEventForm
