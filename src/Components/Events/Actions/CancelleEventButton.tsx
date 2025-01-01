import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"
import { confirm } from "../../Common/Confirm"

const showCancelledConfirm = (eventId: string, cancelled: boolean) => {
    let cancelledText = ""
    confirm({
        title: <div>{cancelled ? "הפעלת אירוע" : "ביטול אירוע"}</div>,
        icon: <Icon icon="warning" />,
        content: (
            <div>
                <div>
                    {cancelled
                        ? "האם אתה בטוחים שאתם רוצים להפעיל את הארוע?"
                        : "האם אתה בטוחים שאתם רוצים לבטל את הארוע?"}
                </div>
                {!cancelled && (
                    <div style={{ marginTop: "16px" }}>
                        <input
                            type="text"
                            maxLength={80}
                            placeholder="הסבר במידת הצורך - ביטול חד״פ/ לצמיתות וכו׳"
                            style={{
                                width: "100%",
                                padding: "8px",
                                direction: "rtl",
                                border: "1px solid #d9d9d9",
                                borderRadius: "6px",
                            }}
                            onChange={(e) => {
                                cancelledText = e.target.value
                                // Update character count
                                const charCountElement =
                                    document.getElementById("charCount")
                                if (charCountElement) {
                                    charCountElement.textContent = `${e.target.value.length}/80`
                                }
                            }}
                        />
                        <div
                            id="charCount"
                            style={{
                                textAlign: "left",
                                fontSize: "12px",
                                color: "#666",
                                marginTop: "4px",
                            }}
                        >
                            0/80
                        </div>
                    </div>
                )}
            </div>
        ),
        okText: cancelled ? "הפעלה" : "ביטול אירוע",
        okType: "danger",
        cancelText: "חזרה",
        direction: "rtl",
        onOk: async () => {
            await store.updateCIEvent({
                id: eventId,
                cancelled: !cancelled,
                cancelled_text: cancelledText,
            })
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            )
        },
    })
}

interface ICancelledEventProps {
    eventId: string
    cancelled: boolean
}

export default function CancelledEventButton({
    eventId,
    cancelled,
}: ICancelledEventProps) {
    return (
        <button
            className="action-btn"
            onClick={() => showCancelledConfirm(eventId, cancelled)}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            {cancelled ? <Icon icon="check_circle" /> : <Icon icon="cancel" />}
        </button>
    )
}
