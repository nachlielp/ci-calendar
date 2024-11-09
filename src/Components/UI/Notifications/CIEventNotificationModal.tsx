import Modal from "antd/es/modal"
import { useState } from "react"
import Select from "antd/es/select"
import { useUser } from "../../../context/UserContext"
import { notificationService } from "../../../supabase/notificationService"
import Alert from "antd/es/alert/Alert"
import { Icon } from "../../Common/Icon"
import SecondaryButton from "../../Common/SecondaryButton"

const notificationOptions = [
    { label: " לא רוצה התראה", value: "0" },
    { label: "שעה לפני הארוע", value: "1" },
    { label: "שעתיים לפני הארוע", value: "2" },
    { label: "4 שעות לפני הארוע", value: "4" },
    { label: "יום לפני הארוע", value: "24" },
    { label: "יומיים לפני הארוע", value: "48" },
]

const NOTIFICATION_MODAL_BUTTON_OFF_ALERT =
    "צריך להפעיל את ההתראות בהגדרות לפני שניתן ליצור התראה"

export default function CIEventNotificationModal({
    eventId,
}: {
    eventId: string
}) {
    const { user } = useUser()

    if (!user) return null

    const [isOpen, setIsOpen] = useState(false)
    const [remindInHours, setRemindInHours] = useState<string>("1")

    const isActive = () => {
        const notification = user.notifications?.find(
            (n) => n.ci_event_id === eventId
        )
        return notification && notification?.remind_in_hours !== "0"
    }

    const openModal = () => {
        const notification = user.notifications?.find(
            (n) => n.ci_event_id === eventId
        )
        setRemindInHours(notification?.remind_in_hours || "1")
        setIsOpen(true)
    }

    const handleOk = async () => {
        const currentNotification = user.notifications.find(
            (n) => n.ci_event_id === eventId
        )
        if (
            currentNotification &&
            remindInHours === currentNotification.remind_in_hours
        ) {
            setIsOpen(false)
            return
        }
        if (currentNotification) {
            await notificationService.updateNotification({
                id: currentNotification.id,
                remind_in_hours: remindInHours,
                ci_event_id: eventId,
                user_id: user.user_id,
            })
        } else {
            await notificationService.createNotification({
                ci_event_id: eventId,
                user_id: user.user_id,
                remind_in_hours: remindInHours,
            })
        }
        setIsOpen(false)
    }

    return (
        <section className="notification-modal-button">
            <SecondaryButton
                label=""
                successLabel=""
                icon={isActive() ? "notifications_active" : "notifications"}
                successIcon={
                    isActive() ? "notifications_active" : "notifications"
                }
                callback={openModal}
            />
            <Modal
                open={isOpen}
                onCancel={() => setIsOpen(false)}
                footer={null}
                className="set-notification-timeframe-modal"
            >
                <section className="notification-modal-container">
                    <article className="notification-modal-title">
                        <Icon
                            icon="notifications"
                            className="notification-icon"
                        />
                        <label className="label-text">
                            אני רוצה לקבל התראה
                        </label>
                    </article>
                    <Select
                        options={notificationOptions}
                        value={remindInHours.toString()}
                        style={{ width: "200px" }}
                        onChange={(value) => setRemindInHours(value)}
                    />

                    {!user.receive_notifications && (
                        <Alert
                            message={NOTIFICATION_MODAL_BUTTON_OFF_ALERT}
                            type="warning"
                        />
                    )}
                    {user.receive_notifications && (
                        <SecondaryButton
                            label="אישור"
                            successLabel="אישור"
                            icon={"check"}
                            successIcon={"check"}
                            callback={handleOk}
                            disabled={!user?.receive_notifications}
                            className="notification-modal-button"
                        />
                    )}
                </section>
            </Modal>
        </section>
    )
}