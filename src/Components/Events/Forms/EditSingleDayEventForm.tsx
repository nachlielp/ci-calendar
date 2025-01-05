import Form from "antd/es/form"
import Input from "antd/es/input"
import customParseFormat from "dayjs/plugin/customParseFormat"
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
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton"
import UpdateRecurringEventInstances from "./UpdateRecurringEventInstances"
import { editSingleDayEventViewModal as vm } from "./EditSingleDayEventVM"
import { useEffect } from "react"

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
    event: CIEvent | undefined
    template: CITemplate | undefined
    closeForm: () => void
}) {
    const [form] = Form.useForm()

    useEffect(() => {
        if (event?.id) {
            vm.setSelectedEventId(event.id)
        }
        return () => {
            vm.setSelectedEventId(null)
        }
    }, [event?.id])

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
        vm.setAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
    }

    const handleSubmit = async (values: any) => {
        vm.setIsSubmitting(true)

        if (event) {
            const updatedEvent: Partial<DBCIEvent> =
                utilService.formatFormValuesToEditCIEvent(
                    values,
                    vm.getAddress || (address as IAddress),
                    event.is_multi_day
                )
            try {
                //TODO
                console.log("__update all recurrance: ", values)
                if (values["update-recurring-events"]) {
                    await store.updateCIEvent({
                        ...updatedEvent,
                        id: event.id,
                    })
                } else {
                    await store.updateCIEvent({
                        ...updatedEvent,
                        id: event.id,
                    })
                }
                // closeForm()
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
            } finally {
                vm.setIsSubmitting(false)
            }
        } else if (template) {
            const updatedTemplate =
                utilService.formatFormValuesToEditCITemplate(
                    values,
                    vm.getAddress || (address as IAddress),
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
                vm.setIsSubmitting(false)
            }
        }
    }

    const onFinishFailed = () => {
        vm.setIsInputError(true)
        setTimeout(() => {
            vm.setIsInputError(false)
        }, 4000)
    }

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
                    handleDateChange={vm.setStartDate}
                    handleEndDateChange={vm.setEndDate}
                    eventDate={vm.getStartDate}
                    endDate={vm.getEndDate}
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
                <EventFromFooter inputErrors={vm.getIsInputError} />
                <UpdateRecurringEventInstances eventId={event?.id} />
                <Form.Item
                    wrapperCol={{ span: 24 }}
                    className="submit-button-container"
                    style={{
                        display: "flex",
                        justifyContent: "flex-start",
                    }}
                >
                    <AsyncFormSubmitButton
                        isSubmitting={vm.getIsSubmitting}
                        size="large"
                    >
                        {isTemplate ? "עדכון תבנית" : "עדכון אירוע"}
                    </AsyncFormSubmitButton>
                </Form.Item>
            </Form>
        </section>
    )
}
