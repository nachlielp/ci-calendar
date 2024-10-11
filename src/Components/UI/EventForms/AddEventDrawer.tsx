import { useState } from "react"
import { Drawer } from "antd"
import SingleDayEventForm from "./SingleDayEventForm"
import MultiDayEventForm from "./MultiDayEventForm"

export function AddEventDrawer({
    anchorEl,
    eventType,
    isTemplate,
}: {
    anchorEl: any
    eventType: string
    isTemplate?: boolean
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
                {eventType === "single-day" ? (
                    <SingleDayEventForm
                        closeForm={onClose}
                        isTemplate={isTemplate}
                    />
                ) : (
                    <MultiDayEventForm />
                )}
            </Drawer>
        </>
    )
}
