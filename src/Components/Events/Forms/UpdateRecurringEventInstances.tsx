import { Checkbox } from "antd"
import Form from "antd/lib/form"
import dayjs from "dayjs"
import { observer } from "mobx-react-lite"
import { store } from "../../../Store/store"
import { useState } from "react"
import "../../../styles/update-recurring-event-instance.css"

const UpdateRecurringEventInstances = ({ eventId }: { eventId?: string }) => {
    const [updateRecurring, setUpdateRecurring] = useState<boolean>(false)
    if (!eventId) return
    const events = store.getFutureRecurringEvents(eventId)
    return (
        <section className="update-recurring-event-instance">
            <hr className="divider" />

            <Form.Item
                name="update-recurring-events"
                valuePropName="checked"
                initialValue={false}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "start",
                        alignContent: "center",
                        gap: "8px",
                    }}
                >
                    <Checkbox
                        style={{
                            marginTop: "10px",
                            transform: "scale(1.5)",
                        }}
                        value={updateRecurring}
                        onChange={(e) => setUpdateRecurring(e.target.checked)}
                    />
                    <label className="segment-title">
                        האם לעדכן את כל האירועים העתידיים?{" "}
                        <span className="segment-description">
                            (עדכון כל המידע באירוע למעט התאריכים)
                        </span>
                    </label>
                </div>
            </Form.Item>
            <div className="recurring-event-date-list">
                {updateRecurring &&
                    events.map((event) => (
                        <div key={event.id} className="recurring-event-date">
                            יום {dayjs(event.start_date).format("dddd")} -{" "}
                            {dayjs(event.start_date).format("DD/MM/YYYY")}
                            {event.is_multi_day &&
                                `  יום ${dayjs(event.end_date).format(
                                    "dddd"
                                )} - ${dayjs(event.end_date).format(
                                    "DD/MM/YYYY"
                                )}`}
                        </div>
                    ))}
            </div>
        </section>
    )
}

export default observer(UpdateRecurringEventInstances)
