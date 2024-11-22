import Modal from "antd/es/modal"
import SecondaryButton from "../Common/SecondaryButton"
import { useState, useEffect } from "react"
import { Icon } from "../Common/Icon"
import Select from "antd/es/select"
import { notificationService } from "../../supabase/notificationService"
import Alert from "antd/es/alert/Alert"
import {
    singleDayNotificationOptions,
    multiDayNotificationOptions,
} from "../../util/options"
import AsyncButton from "../Common/AsyncButton"
import { EventPayloadType, NotificationType } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const NOTIFICATION_MODAL_BUTTON_OFF_ALERT =
    "צריך להפעיל את ההתראות בהגדרות לפני שניתן ליצור ולערוך התראות"

const CIEventNotificationModal = ({
    eventId,
    isMultiDay,
}: {
    eventId: string
    isMultiDay: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [remindInHours, setRemindInHours] = useState<string | null>(null)

    useEffect(() => {
        setRemindInHours(
            store.getNotificationByEventId(eventId)?.remind_in_hours || "0"
        )
    }, [store.getNotificationByEventId(eventId)])

    const icon = () => {
        const notification = store.getNotificationByEventId(eventId)
        return notification && notification?.remind_in_hours !== "0"
            ? "notifications_active"
            : "notifications"
    }

    const openModal = () => {
        const notification = store.getNotificationByEventId(eventId)
        setRemindInHours(notification?.remind_in_hours || "0")
        setIsOpen(true)
    }

    const handleOk = async () => {
        if (typeof remindInHours !== "string") return

        try {
            setIsSubmitting(true)
            const notification = await notificationService.upsertNotification({
                remind_in_hours: remindInHours,
                ci_event_id: eventId,
                user_id: store.getUserId,
                is_sent: false,
                type: NotificationType.reminder,
            })

            if (notification) {
                store.setNotification(notification, EventPayloadType.UPDATE)
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
                icon={icon()}
                successIcon={icon()}
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
                        disabled={!store.getUserReceiveNotifications}
                    />

                    {!store.getUserReceiveNotifications && (
                        <Alert
                            message={NOTIFICATION_MODAL_BUTTON_OFF_ALERT}
                            type="warning"
                        />
                    )}
                    {store.getUserReceiveNotifications && (
                        <AsyncButton
                            isSubmitting={isSubmitting}
                            callback={handleOk}
                            disabled={!store.getUserReceiveNotifications}
                        >
                            אישור
                        </AsyncButton>
                    )}
                </section>
            </Modal>
        </section>
    )
}

export default observer(CIEventNotificationModal)
