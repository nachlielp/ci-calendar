import { Card, Form, Input } from "antd"
import { useEffect, useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import { CIEvent, IAddress, CITemplate } from "../../../util/interfaces"
import Loading from "../Other/Loading"
import AddLinksForm from "./AddLinksForm"
import AddPricesForm from "./AddPricesForm"
import MultiDayFormHead from "./MultiDayFormHead"
import { IGooglePlaceOption } from "../Other/GooglePlacesInput"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { EventAction } from "../../../App"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "../../../context/UserContext"
import { cieventsService } from "../../../supabase/cieventsService.ts"
import { templateService } from "../../../supabase/templateService.ts"
import { utilService } from "../../../util/utilService"

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
    const { teachers } = useTeachersList()
    const { user } = useUser()
    if (!user) {
        throw new Error("user is null, make sure you're within a Provider")
    }
    const [newAddress, setNewAddress] = useState<IAddress | null>(null)
    const [newDates, setNewDates] = useState<[Dayjs, Dayjs] | null>(null)

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
            if (!newDates && !values["event-dates"]) {
                console.error("dates are null")
                return
            }

            const submitedEventId =
                editType === EventAction.recycle ? uuidv4() : event.id

            const updatedEvent: CIEvent = {
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
                id: submitedEventId,
                address: (newAddress || address) as IAddress,
                created_at: event.created_at,
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
                source_template_id: event.source_template_id,
                is_multi_day: true,
                multi_day_teachers:
                    utilService.formatTeachersForCIEvent(
                        values["multi-day-event-teachers"],
                        teachers
                    ) || [],
            }
            try {
                if (editType === EventAction.recycle) {
                    await cieventsService.createCIEvent(updatedEvent)
                    closeForm()
                } else {
                    await cieventsService.updateCIEvent(event.id, updatedEvent)
                    closeForm()
                }
            } catch (error) {
                console.error("EventForm.handleSubmit.error: ", error)
                throw error
            }
        } else if (template) {
            const updatedTemplate: CITemplate = {
                type: values["main-event-type"].value,
                template_id: template.template_id,
                address: (address || template.address) as IAddress,
                created_at: template.created_at,
                updated_at: dayjs().toISOString(),
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
                name: values["template-name"],
                created_by: user.user_id,
            }

            try {
                await templateService.updateTemplate(updatedTemplate)
                closeForm()
            } catch (error) {
                console.error(
                    "EventForm.handleSubmit.updateTemplate.error: ",
                    error
                )
            }
        }
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
                        teachers={teachers}
                        titleText={titleText}
                    />

                    <AddLinksForm />
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
                            {submitText}
                        </button>
                    </Form.Item>
                </Form>
            </Card>
        </>
    )
}
