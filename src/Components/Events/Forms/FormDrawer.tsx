import { useState } from "react"
import Drawer from "antd/es/drawer"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import EditMultiDayEventForm from "./EditMultiDayEventForm"
import { CIEvent, CITemplate } from "../../../util/interfaces"

export function FormDrawer({
    anchorEl,
    eventType,
    isTemplate,
    event,
    template,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    event?: CIEvent
    template?: CITemplate
}) {
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
            <Drawer onClose={onClose} open={open} bodyStyle={{ padding: 4 }}>
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
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                    />
                )}
                {eventType === "edit-multi-day" && (
                    <EditMultiDayEventForm
                        isTemplate={isTemplate}
                        event={event}
                        template={template}
                        closeForm={onClose}
                    />
                )}
            </Drawer>
        </>
    )
}
