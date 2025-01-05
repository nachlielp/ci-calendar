import { Checkbox } from "antd"
import Form from "antd/lib/form"
import dayjs from "dayjs"
import { observer } from "mobx-react-lite"
import { store } from "../../../Store/store"
import { editSingleDayEventViewModal as vm } from "./EditSingleDayEventVM"

import "../../../styles/update-recurring-event-instance.css"

const UpdateRecurringEventInstances = ({ eventId }: { eventId?: string }) => {
    const events = store.getFutureRecurringEvents(eventId)

    if (!eventId) return
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
                        value={vm.getUpdateRecurring}
                        onChange={(e) =>
                            vm.setUpdateRecurring(e.target.checked)
                        }
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
                {vm.updateRecurring &&
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="recurring-event-date"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <Checkbox
                                checked={vm.getSelectedEventsIds.includes(
                                    event.id
                                )}
                                onChange={() =>
                                    vm.updateSelectedEvent(event.id)
                                }
                                style={{
                                    transform: "scale(1.5)",
                                }}
                            />
                            <span>
                                יום {dayjs(event.start_date).format("dddd")} -{" "}
                                {dayjs(event.start_date).format("DD/MM/YYYY")}
                                {event.is_multi_day &&
                                    `  יום ${dayjs(event.end_date).format(
                                        "dddd"
                                    )} - ${dayjs(event.end_date).format(
                                        "DD/MM/YYYY"
                                    )}`}
                            </span>
                        </div>
                    ))}
            </div>
        </section>
    )
}

export default observer(UpdateRecurringEventInstances)
