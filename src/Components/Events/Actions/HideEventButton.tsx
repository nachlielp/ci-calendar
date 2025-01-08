import { Checkbox } from "antd"
import { Modal } from "antd"
import { store } from "../../../Store/store"
import { Icon } from "../../Common/Icon"
import dayjs from "dayjs"
import { useState } from "react"
import { CIEvent } from "../../../util/interfaces"
import { CheckboxChangeEvent } from "antd/es/checkbox"
import "../../../styles/batch-action-event-modal.css"

export default function HideEventButton({ event }: { event: CIEvent }) {
    const [open, setOpen] = useState(false)
    const [checkedAll, setCheckedAll] = useState(false)
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
    const futureEvents = store
        .getFutureRecurringEventsByRefKey(event)
        .filter((e) => e.hide === event.hide)

    const options = futureEvents.map((e) => ({
        label: `${dayjs(e.start_date).format("DD/MM/YYYY")} - ${e.title}`,
        value: e.id,
    }))

    async function hideEvents() {
        await Promise.all([
            store.updateCIEvent({ id: event.id, hide: !event.hide }),
            ...selectedEventIds.map((eventId) =>
                store.updateCIEvent({ id: eventId, hide: !event.hide })
            ),
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
                style={{ borderRadius: "5px 0px 0px 5px" }}
            >
                {event.hide ? (
                    <Icon icon="visibility" />
                ) : (
                    <Icon icon="visibilityOff" />
                )}
            </button>
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                onOk={hideEvents}
                title={event.hide ? "הצגת ארוע" : "הסתרת ארוע"}
                okText={event.hide ? "הצגה" : "הסתרה"}
                cancelText="ביטול"
                okType="danger"
            >
                <div className="batch-action-event-modal">
                    <div>
                        האם אתם בטוחים שאתם רוצים{" "}
                        {event.hide ? "להציג" : "להסתיר"} את הארוע?
                    </div>
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

                            <div className="checkbox-group">
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
