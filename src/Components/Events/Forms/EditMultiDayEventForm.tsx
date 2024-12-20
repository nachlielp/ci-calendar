import Form from "antd/es/form"
import Input from "antd/es/input"
import { useState } from "react"
import {
    CIEvent,
    IAddress,
    CITemplate,
    DBCIEvent,
} from "../../../util/interfaces.ts"
import Loading from "../../Common/Loading.tsx"
import MultiDayFormHead from "./MultiDayFormHead.tsx"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput.tsx"
import { utilService } from "../../../util/utilService.ts"
import { store } from "../../../Store/store.ts"
import EventFromFooter from "./EventFromFooter.tsx"
import "../../../styles/event-form.css"
export default function EditMultiDayEventForm({
    isTemplate = false,
    event,
    template,
    closeForm,
}: {
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
    closeForm: () => void
}) {
    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    const [form] = Form.useForm()

    const { currentFormValues, address } = event
        ? utilService.CIEventToFormValues(event)
        : template
        ? template.is_multi_day
            ? utilService.multiDayTemplateToFormValues(template)
            : utilService.singleDayTemplateToFormValues(template)
        : { currentFormValues: {}, address: null }

    if (!event && !template) return <Loading />

    const handleAddressSelect = (place: IGooglePlaceOption) => {
        const selectedAddress = {
            label: place.label,
            place_id: place.value.place_id,
        }
        setNewAddress(selectedAddress)
        form.setFieldValue("address", selectedAddress)
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
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
                throw error
            } finally {
                setIsSubmitting(false)
                closeForm()
            }
        } else if (template) {
            const updatedTemplate: Partial<CITemplate> =
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
        setTimeout(() => {
            setInputErrors(true)
            setInputErrors(false)
        }, 3000)
    }
    const submitText = isTemplate ? "עדכון תבנית" : "עדכון אירוע"

    const titleText = isTemplate
        ? "עדכון תבנית - רב יומי"
        : "עדכון אירוע - רב יומי"

    return (
        <section className="event-form">
            <Form
                form={form}
                variant="filled"
                onFinish={handleSubmit}
                initialValues={currentFormValues}
                onFinishFailed={onFinishFailed}
            >
                {isTemplate && (
                    <Form.Item name="template-name" label="שם התבנית">
                        <Input allowClear />
                    </Form.Item>
                )}
                <MultiDayFormHead
                    form={form}
                    handleAddressSelect={handleAddressSelect}
                    address={address || ({} as IAddress)}
                    isTemplate={isTemplate}
                    teachers={store.getAppTaggableTeachers}
                    orgs={store.getAppTaggableOrgs}
                    titleText={titleText}
                />
                <EventFromFooter
                    inputErrors={inputErrors}
                    isSubmitting={isSubmitting}
                    submitText={submitText}
                />
            </Form>
        </section>
    )
}
