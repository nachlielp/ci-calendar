import Modal from "antd/es/modal"
import SecondaryButton from "../Common/SecondaryButton"
import { useState, useEffect } from "react"
import { Icon } from "../Common/Icon"
import Select from "antd/es/select"
import { useUser } from "../../context/UserContext"
import { notificationService } from "../../supabase/notificationService"
import Alert from "antd/es/alert/Alert"
import {
    singleDayNotificationOptions,
    multiDayNotificationOptions,
} from "../../util/options"
import AsyncButton from "../Common/AsyncButton"
import { NotificationType } from "../../util/interfaces"

const NOTIFICATION_MODAL_BUTTON_OFF_ALERT =
    "צריך להפעיל את ההתראות בהגדרות לפני שניתן ליצור ולערוך התראות"

export default function CIEventNotificationModal({
    eventId,
    isMultiDay,
}: {
    eventId: string
    isMultiDay: boolean
}) {
    const { user, updateUserState } = useUser()

    if (!user) return null

    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [remindInHours, setRemindInHours] = useState<string | null>(null)

    useEffect(() => {
        const userNotification = user.notifications?.find(
            (n) => n.ci_event_id === eventId
        )
        setRemindInHours(userNotification?.remind_in_hours || "0")
    }, [user])

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
        setRemindInHours(notification?.remind_in_hours || "0")
        setIsOpen(true)
    }

    const handleOk = async () => {
        if (!remindInHours) return
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

        try {
            setIsSubmitting(true)
            const notification = await notificationService.upsertNotification({
                remind_in_hours: remindInHours,
                ci_event_id: eventId,
                user_id: user.user_id,
                is_sent: false,
                type: NotificationType.reminder,
            })

            if (notification) {
                updateUserState({
                    notifications: [
                        ...user.notifications.filter(
                            (n) => n.ci_event_id !== eventId
                        ),
                        { ...notification, is_multi_day: isMultiDay },
                    ],
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
            setIsOpen(false)
        }
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
                        options={
                            isMultiDay
                                ? multiDayNotificationOptions
                                : singleDayNotificationOptions
                        }
                        value={remindInHours?.toString() || "1"}
                        style={{ width: "200px" }}
                        onChange={(value) => setRemindInHours(value)}
                        disabled={!user?.receive_notifications}
                    />

                    {!user.receive_notifications && (
                        <Alert
                            message={NOTIFICATION_MODAL_BUTTON_OFF_ALERT}
                            type="warning"
                        />
                    )}
                    {user.receive_notifications && (
                        <AsyncButton
                            isSubmitting={isSubmitting}
                            callback={handleOk}
                            disabled={!user?.receive_notifications}
                        >
                            אישור
                        </AsyncButton>
                    )}
                </section>
            </Modal>
        </section>
    )
}
