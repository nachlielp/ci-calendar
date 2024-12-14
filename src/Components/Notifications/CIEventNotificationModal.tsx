import Modal from "antd/es/modal"
import SecondaryButton from "../Common/SecondaryButton"
import { useMemo } from "react"
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
import { observable, reaction, action, computed } from "mobx"
import { makeObservable } from "mobx"
import { utilService } from "../../util/utilService"
import "../../styles/cievent-notification-modal.css"

const NOTIFICATION_MODAL_BUTTON_OFF_ALERT =
    "צריך להפעיל את ההתראות בהגדרות לפני שניתן ליצור ולערוך התראות"
const NOTIFICATION_MODAL_NOT_INSTALLED =
    "צריך להתקין את האפליקציה לפני שניתן ליצור ולערוך התראות"

class CIEventNotificationModalVM {
    @observable isOpen = false
    @observable isSubmitting = false
    @observable remindInHours: string | null = null
    @observable isActive = false
    eventId: string
    isMultiDay: boolean

    constructor(eventId: string, isMultiDay: boolean) {
        makeObservable(this)
        this.eventId = eventId
        this.isMultiDay = isMultiDay

        const notification = store.getNotificationByEventId(this.eventId)
        this.remindInHours = notification?.remind_in_hours || "0"
        this.isActive =
            notification !== undefined && notification.remind_in_hours !== "0"

        reaction(
            () => store.getNotifications,
            () => {
                const notification = store.getNotificationByEventId(
                    this.eventId
                )
                this.remindInHours = notification?.remind_in_hours || "0"
                this.isActive =
                    notification !== undefined &&
                    notification.remind_in_hours !== "0"
            }
        )
    }

    @computed
    get getIsOpen() {
        return this.isOpen
    }

    @computed
    get getRemindInHours() {
        return this.remindInHours
    }

    @computed
    get getIsActive() {
        return this.isActive
    }

    @computed
    get getIsSubmitting() {
        return this.isSubmitting
    }
    @action
    setIsSubmitting = (isSubmitting: boolean) => {
        this.isSubmitting = isSubmitting
    }

    @action
    setIsOpen = (isOpen: boolean) => {
        console.log("setIsOpen", isOpen)
        this.isOpen = isOpen
    }

    @action
    setRemindInHours = (remindInHours: string) => {
        this.remindInHours = remindInHours
    }

    @action
    upsertNotification = async () => {
        if (typeof this.remindInHours !== "string") return

        try {
            this.setIsSubmitting(true)
            await store.upsertNotification({
                remind_in_hours: this.remindInHours,
                ci_event_id: this.eventId,
                user_id: store.getUserId,
                sent: false,
                type: NotificationType.reminder,
            })
        } catch (error) {
            console.error(error)
        } finally {
            this.setIsSubmitting(false)
            this.setIsOpen(false)
        }
    }
}
//services both event list and notifications list
const CIEventNotificationModal = ({
    eventId,
    isMultiDay,
}: {
    eventId: string
    isMultiDay: boolean
}) => {
    const vm = useMemo(
        () => new CIEventNotificationModalVM(eventId, isMultiDay),
        []
    )

    return (
        <section className="notification-modal-button">
            <SecondaryButton
                label=""
                successLabel=""
                icon={vm.getIsActive ? "notifications_active" : "notifications"}
                successIcon={
                    vm.getIsActive ? "notifications_active" : "notifications"
                }
                callback={() => vm.setIsOpen(true)}
            />
            <Modal
                open={vm.getIsOpen}
                onCancel={() => vm.setIsOpen(false)}
                footer={null}
                className="set-notification-timeframe-modal"
                closable={false}
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
                        value={vm.getRemindInHours?.toString() || "1"}
                        style={{ width: "200px" }}
                        onChange={(value) => vm.setRemindInHours(value)}
                        disabled={
                            !store.getUserReceiveNotifications ||
                            !utilService.isPWA()
                        }
                        size="large"
                        className="form-input-large"
                        popupClassName="form-input-large"
                    />

                    {utilService.isPWA() &&
                        !store.getUserReceiveNotifications && (
                            <Alert
                                message={NOTIFICATION_MODAL_BUTTON_OFF_ALERT}
                                type="warning"
                            />
                        )}
                    {!utilService.isPWA() && (
                        <Alert
                            message={NOTIFICATION_MODAL_NOT_INSTALLED}
                            type="warning"
                        />
                    )}
                    {store.getUserReceiveNotifications && (
                        <AsyncButton
                            className="general-action-btn large-btn"
                            isSubmitting={vm.getIsSubmitting}
                            callback={vm.upsertNotification}
                            disabled={
                                !store.getUserReceiveNotifications ||
                                !utilService.isPWA()
                            }
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
