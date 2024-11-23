import Card from "antd/es/card"
import Form from "antd/es/form"
import Input from "antd/es/input"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import {
    CIEvent,
    IAddress,
    CITemplate,
    DBCIEvent,
} from "../../../util/interfaces.ts"
import Loading from "../../Common/Loading.tsx"
import AddLinksForm from "./AddLinksForm.tsx"
import AddPricesForm from "./AddPricesForm.tsx"
import MultiDayFormHead from "./MultiDayFormHead.tsx"
import { IGooglePlaceOption } from "../../Common/GooglePlacesInput.tsx"
import { EventAction } from "../../../App.tsx"
import { utilService } from "../../../util/utilService.ts"
import AsyncFormSubmitButton from "../../Common/AsyncFormSubmitButton.tsx"
import Alert from "antd/es/alert/Alert"
import { store } from "../../../Store/store.ts"

export default function EditMultiDayEventForm({
    editType,
    isTemplate = false,
    event,
    template,
    closeForm,
}: {
    editType: EventAction
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
    closeForm: () => void
}) {
    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [newDates, setNewDates] = useState<[Dayjs, Dayjs] | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inputErrors, setInputErrors] = useState<boolean>(false)

    useEffect(() => {
        if (event) {
            setNewDates([dayjs(event.start_date), dayjs(event.end_date)])
        }
    }, [])

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

    const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
        setNewDates(dates)
    }

    const handleSubmit = async (values: any) => {
        if (event) {
            setIsSubmitting(true)
            if (!newDates && !values["event-dates"]) {
                console.error("dates are null")
                return
            }

            const updatedEvent: DBCIEvent = {
                id: event.id,
                is_notified: event.is_notified,
                cancelled: event.cancelled,
                start_date:
                    newDates?.[0]
                        ?.hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss") ?? "",
                end_date:
                    newDates?.[1]
                        ?.hour(13)
                        .minute(0)
                        .second(0)
                        .format("YYYY-MM-DDTHH:mm:ss") ?? "",
                type: values["main-event-type"],
                address: (newAddress || address) as IAddress,
                created_at: event.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [
                    {
                        value: store.user.user_id,
                        label: store.user.user_name,
                    },
                ],
                links: values["links"] || [],
                price: values["prices"] || [],
                hide: false,
                segments: [],
                district: values["district"],
                user_id: store.user.user_id,
                source_template_id: event.source_template_id,
                is_multi_day: true,
                multi_day_teachers:
                    utilService.formatUsersForCIEvent(
                        values["multi-day-event-teachers"],
                        store.getAppTaggableTeachers
                    ) || [],
                organisations:
                    utilService.formatUsersForCIEvent(
                        values["event-orgs"],
                        store.getAppTaggableOrgs
                    ) || [],
            }
            try {
                await store.updateCIEvent(updatedEvent)
                closeForm()
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
                throw error
            } finally {
                setIsSubmitting(false)
            }
        } else if (template) {
            setIsSubmitting(true)
            const updatedTemplate: CITemplate = {
                type: values["main-event-type"].value,
                id: template.id,
                address: (address || template.address) as IAddress,
                created_at: template.created_at,
                updated_at: dayjs().toISOString(),
                title: values["event-title"],
                description: values["event-description"] || "",
                owners: [
                    {
                        value: store.user.user_id,
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
                        values["multi-day-event-teachers"],
                        store.getAppTaggableTeachers
                    ) || [],
                name: values["template-name"],
                user_id: store.user.user_id,
                organisations:
                    utilService.formatUsersForCIEvent(
                        values["event-orgs"],
                        store.getAppTaggableOrgs
                    ) || [],
            }
            try {
                await store.updateTemplate(updatedTemplate)
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
    }

    const submitText = isTemplate
        ? "עדכון תבנית"
        : editType === EventAction.recycle
        ? "שיכפול אירוע"
        : "עדכון אירוע"

    const titleText = isTemplate
        ? "עדכון תבנית - רב יומי"
        : editType === EventAction.recycle
        ? "שיכפול אירוע - רב יומי"
        : "עדכון אירוע - רב יומי"

    return (
        <>
            <Card className="edit-multi-day-event-form">
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
                        handleAddressSelect={handleAddressSelect}
                        handleDateChange={handleDateChange}
                        address={address || ({} as IAddress)}
                        isTemplate={isTemplate}
                        teachers={store.getAppTaggableTeachers}
                        orgs={store.getAppTaggableOrgs}
                        titleText={titleText}
                    />

                    <AddLinksForm />
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
                            {submitText}
                        </AsyncFormSubmitButton>
                    </Form.Item>
                </Form>
            </Card>
        </>
    )
}
