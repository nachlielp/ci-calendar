import { store } from "../../../Store/store"
import { Checkbox, Modal } from "antd"
import type { CheckboxChangeEvent } from "antd/es/checkbox"
import { CIEvent } from "../../../util/interfaces"
import dayjs from "dayjs"
import { useState } from "react"
import '../../../styles/batch-action-event-modal.scss'
import Alert from "antd/es/alert/Alert"

interface IEditRecurringEventProps {
    event: CIEvent
    isSubmitting: boolean
    handleEventIdsChange: (eventIds: string[]) => void
}

export default function EditRecurringEventButton({
    event,
    handleEventIdsChange,
}: IEditRecurringEventProps) {
    console.log("EditRecurringEventButton")
    const [open, setOpen] = useState(false)
    const [checkedAll, setCheckedAll] = useState(false)
    const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
    const futureEvents = store.getFutureRecurringEventsByRefKey(event)
    const options = futureEvents.map((e) => ({
        label: `${dayjs(e.start_date).format("DD/MM/YYYY")} - ${e.title}`,
        value: e.id,
    }))

    function onSelectEventIds(eventIds: string[]) {
        setSelectedEventIds(eventIds)
        handleEventIdsChange(eventIds)
    }

    function onCheckAllChange(e: CheckboxChangeEvent) {
        setCheckedAll(e.target.checked)
        if (e.target.checked) {
            onSelectEventIds(options.map((o) => o.value))
            handleEventIdsChange(options.map((o) => o.value))
        } else {
            onSelectEventIds([])
            handleEventIdsChange([])
        }
    }

    function handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        e.preventDefault()
        setOpen(true)
    }

    const onOk = () => {
        const form = document.querySelector("form") as HTMLFormElement
        if (form) {
            form.dispatchEvent(
                new Event("submit", { bubbles: true, cancelable: true })
            )
        }
        setOpen(false)
    }

    return (
        <>
            <button className="general-action-btn" onClick={handleOpen}>
                עדכון אירוע
            </button>
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                onOk={onOk}
                title="עדכון אירוע"
                okText="עדכון"
                cancelText="ביטול"
            >
                <div className="delete-event-modal">
                    <div>האם אתם בטוחים שאתם רוצים לעדכן את הארוע?</div>

                    <div className="font-medium">
                        {`${dayjs(event.start_date).format("DD/MM/YYYY")} - ${
                            event.title
                        }`}
                    </div>
                    <Alert
                        message="עדכון ארועים נוספים יעדכן את כל התוכן של האירוע למעט התאריך, ביטול והסתרה!"
                        type="warning"
                    />
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
