import { useState } from "react"
import { Drawer } from "antd"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"
import EditSingleDayEventForm from "./EditSingleDayEventForm"
import { EventAction } from "../../../App"
import EditMultiDayEventForm from "./EditMultiDayEventForm"

export function FormDrawer({
    anchorEl,
    eventType,
    isTemplate,
    itemId,
}: {
    anchorEl: any
    eventType: string
    isTemplate: boolean
    itemId?: string
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
                {eventType === "edit-single-day" && itemId && (
                    <EditSingleDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        itemId={itemId}
                        closeForm={onClose}
                    />
                )}
                {eventType === "edit-multi-day" && itemId && (
                    <EditMultiDayEventForm
                        editType={EventAction.edit}
                        isTemplate={isTemplate}
                        itemId={itemId}
                        closeForm={onClose}
                    />
                )}
            </Drawer>
        </>
    )
}
