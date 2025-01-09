import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"
import { Checkbox, Modal } from "antd"
import type { CheckboxChangeEvent } from "antd/es/checkbox"
import { CIEvent } from "../../../util/interfaces"
import dayjs from "dayjs"
import { useState } from "react"
import '../../../styles/batch-action-event-modal.scss'

interface IDeleteEventProps {
    event: CIEvent
}

export default function DeleteEventButton({ event }: IDeleteEventProps) {
    const [open, setOpen] = useState(false)
    const [checkedAll, setCheckedAll] = useState(false)
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
    const futureEvents = store.getFutureRecurringEventsByRefKey(event)
    const options = futureEvents.map((e) => ({
        label: `${dayjs(e.start_date).format("DD/MM/YYYY")} - ${e.title}`,
        value: e.id,
    }))

    async function deleteEvents() {
        await Promise.all([
            store.deleteCIEvent(event.id),
            ...selectedEventIds.map((eventId) => store.deleteCIEvent(eventId)),
        ])
        setOpen(false)
    }

    function onSelectEventIds(eventIds: string[]) {
        setSelectedEventIds(eventIds)
    }

    function onCheckAllChange(e: CheckboxChangeEvent) {
        setCheckedAll(e.target.checked)
        if (e.target.checked) {
            onSelectEventIds(options.map((o) => o.value))
        } else {
            onSelectEventIds([])
        }
    }

    return (
        <>
            <button
                className="action-btn"
                onClick={() => setOpen(true)}
                style={{ borderRadius: "0px", borderLeft: "none" }}
            >
                <Icon icon="deleteIcon" />
            </button>
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                onOk={deleteEvents}
                title="מחיקת ארוע"
                okText="מחיקה"
                cancelText="ביטול"
                okType="danger"
            >
                <div className="delete-event-modal">
                    <div>האם אתם בטוחים שאתם רוצים למחוק את הארוע?</div>
                    <div className="font-medium">
                        {`${dayjs(event.start_date).format("DD/MM/YYYY")} - ${
                            event.title
                        }`}
                    </div>
                    {futureEvents.length > 0 && (
                        <div className="space-y-2">
                            <div>ארועים עתידיים באותה סדרה:</div>
                            <div>
                                <Checkbox
                                    onChange={onCheckAllChange}
                                    checked={checkedAll}
                                >
                                    הכל
                                </Checkbox>
                            </div>

                            <div className="space-y-1 pr-6">
                                <Checkbox.Group
                                    options={options}
                                    value={selectedEventIds}
                                    onChange={(checkedValues) => {
                                        onSelectEventIds(
                                            checkedValues as string[]
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
