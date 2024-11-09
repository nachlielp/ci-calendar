import { useState } from "react"
import Drawer from "antd/es/drawer"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import { EventAction } from "../../../App"
import EditMultiDayEventForm from "./EditMultiDayEventForm"
import { CIEvent, CITemplate } from "../../../util/interfaces"
import { DBCIEvent } from "../../../supabase/cieventsService"

export function FormDrawer({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
    updateEventState,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
    updateEventState?: (eventId: string, event: DBCIEvent) => void
}) {
    if (
        !updateEventState &&
        (eventType === "edit-single-day" || eventType === "edit-multi-day")
    ) {
        throw new Error("updateEventState is required")
    }

    const [open, setOpen] = useState(false)

    const showDrawer = () => {
        setOpen(true)
    }

    const onClose = () => {
        setOpen(false)
    }

    return (
        <>
            <div onClick={showDrawer}>{anchorEl}</div>
            <Drawer onClose={onClose} open={open}>
                {eventType === "create-single-day" && (
                    <SingleDayEventForm
                        closeForm={onClose}
                        isTemplate={isTemplate}
                    />
                )}
                {eventType === "create-multi-day" && (
                    <MultiDayEventForm
                        closeForm={onClose}
                        isTemplate={isTemplate}
                    />
                )}
                {eventType === "edit-single-day" && (
                    <EditSingleDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                        updateEventState={updateEventState!}
                    />
                )}
                {eventType === "edit-multi-day" && (
                    <EditMultiDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                        updateEventState={updateEventState!}
                    />
                )}
            </Drawer>
        </>
    )
}