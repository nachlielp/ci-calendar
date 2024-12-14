import Form from "antd/es/form"
import Input from "antd/es/input"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useState } from "react"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import {
    IAddress,
    CIEvent,
    CITemplate,
    DBCIEvent,
} from "../../../util/interfaces"
import "../../../styles/event-form.css"
import Loading from "../../Common/Loading"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput"
import SingleDayEventFormHead from "./SingleDayEventFormHead"
import EventSegmentsForm from "./EventSegmentsForm"
import { utilService } from "../../../util/utilService"
import { store } from "../../../Store/store"
import EventFromFooter from "./EventFromFooter"
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
    isTemplate = false,
    event,
    template,
    closeForm,
}: {
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

        if (event) {
            const updatedEvent: Partial<DBCIEvent> =
                utilService.formatFormValuesToEditCIEvent(
                    values,
                    newAddress || (address as IAddress),
                    event.is_multi_day
                )
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
            const updatedTemplate =
                utilService.formatFormValuesToEditCITemplate(
                    values,
                    newAddress || (address as IAddress),
                    template.is_multi_day
                )

            try {
                await store.updateTemplate({
                    ...updatedTemplate,
                    id: template.id,
                })
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
        setTimeout(() => {
            setInputErrors(false)
        }, 3000)
    }

    const submitText = isTemplate ? "עדכון תבנית" : "עדכון אירוע"

    const titleText = isTemplate
        ? "עדכון תבנית - חד יומי"
        : "עדכון אירוע - חד יומי"

    return (
        <section className="event-form">
            <Form
                {...formItemLayout}
                form={form}
                onFinish={handleSubmit}
                variant="filled"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
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
                <EventFromFooter
                    inputErrors={inputErrors}
                    isSubmitting={isSubmitting}
                    submitText={submitText}
                />
            </Form>
            <div className="footer-space"></div>
        </section>
    )
}
