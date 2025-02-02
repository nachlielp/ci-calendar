import { makeAutoObservable, reaction, observable, action } from "mobx"
import { computed } from "mobx"
import { store } from "../../Store/store"
import { utilService } from "../../util/utilService"
import { NotificationType } from "../../util/interfaces"

class AlertsAnchorVM {
    @observable open = false

    constructor() {
        makeAutoObservable(this)

        setTimeout(() => {
            reaction(
                () => store.getAlerts,
                () => {
                    this.cleanup()
                    if (navigator.setAppBadge) {
                        navigator.setAppBadge(this.alertsCount)
                    }
                }
            ),
                0
        })
    }

    @computed get alertsCount() {
        return this.getAlerts.length
    }

    @computed get getAlerts() {
        if (!store.getAlerts) return []
        return store.getAlerts
            .filter((alert) => !alert.viewed)
            .filter((alert) =>
                alert.ci_event_id
                    ? utilService.validateEventNotification(
                          alert,
                          store.getEvents
                      )
                    : true
            )
    }

    @computed get shouldDisplayAlerts() {
        return store.isUser
    }

    @action toggleOpen() {
        this.open = !this.open
    }

    @action setOpen(open: boolean) {
        this.open = open
    }

    @action cleanup() {
        const openAdminRequestIds = store.getRequests
            .filter((r) => !r.viewed)
            .map((r) => r.id)
        const futureEventIds = store.getEvents.map((e) => e.id)

        const alertIdsToClose = this.getAlerts // Only process unviewed alerts
            .filter((a) => {
                if (a.type === NotificationType.admin_response) {
                    return !openAdminRequestIds.includes(a.id)
                } else if (
                    a.type === NotificationType.reminder ||
                    a.type === NotificationType.subscription
                ) {
                    return (
                        (a.ci_event_id &&
                            !futureEventIds.includes(a.ci_event_id)) ||
                        !a.ci_event_id
                    )
                }
                return false
            })
            .map((a) => a.id)

        Promise.all(
            alertIdsToClose.map((id) => store.updateAlert({ id, viewed: true }))
        )
    }
}

export const alertsAnchorViewModal = new AlertsAnchorVM()
