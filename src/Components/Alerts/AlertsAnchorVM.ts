import { makeAutoObservable, reaction, observable, action } from "mobx"
import { computed } from "mobx"
import { store } from "../../Store/store"
import { utilService } from "../../util/utilService"
import { CIAlert } from "../../util/interfaces"

class AlertsAnchorVM {
    @observable open = false

    constructor() {
        makeAutoObservable(this)

        reaction(
            () => store.getAlerts,
            () => {
                if (navigator.setAppBadge) {
                    navigator.setAppBadge(this.alertsCount)
                }
            }
        )
    }

    @computed get alertsCount() {
        return this.alerts.length
    }

    @computed get alerts() {
        if (!store.getAlerts) return []
        return store.getAlerts
            .filter((alert) => !alert.viewed)
            .filter((alert) =>
                alert.request_id
                    ? true
                    : utilService.validateEventNotification(
                          alert,
                          store.getEvents
                      )
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
}

export const alertsAnchorViewModal = new AlertsAnchorVM()
