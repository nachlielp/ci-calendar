import Modal from "antd/es/modal"
import SecondaryButton from "../Common/SecondaryButton"
import { useState, useEffect } from "react"
import { Icon } from "../Common/Icon"
import Select from "antd/es/select"
import Alert from "antd/es/alert/Alert"
import {
    singleDayNotificationOptions,
    multiDayNotificationOptions,
} from "../../util/options"
import AsyncButton from "../Common/AsyncButton"
import { NotificationType } from "../../util/interfaces"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const NOTIFICATION_MODAL_BUTTON_OFF_ALERT =
    "צריך להפעיל את ההתראות בהגדרות לפני שניתן ליצור ולערוך התראות"

//services both event list and notifications list
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
    const [isActive, setIsActive] = useState(false)
    useEffect(() => {
        const notification = store.getNotifications.find(
            (n) => n.ci_event_id === eventId
        )
        setRemindInHours(notification?.remind_in_hours || "0")
        setIsActive(
            notification !== undefined && notification.remind_in_hours !== "0"
        )
    }, [store.notifications])

    const openModal = () => {
        const notification = store.getNotificationByEventId(eventId)
        setRemindInHours(notification?.remind_in_hours || "0")
        setIsOpen(true)
    }

    const handleOk = async () => {
        if (typeof remindInHours !== "string") return

        try {
            setIsSubmitting(true)
            await store.upsertNotification({
                remind_in_hours: remindInHours,
                ci_event_id: eventId,
                user_id: store.getUserId,
                sent: false,
                type: NotificationType.reminder,
            })
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
                icon={isActive ? "notifications_active" : "notifications"}
                successIcon={
                    isActive ? "notifications_active" : "notifications"
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
