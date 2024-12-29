import { makeAutoObservable, reaction, observable, action } from "mobx"
import { computed } from "mobx"
import { store } from "../../Store/store"
import { utilService } from "../../util/utilService"

class AlertsAnchorVM {
    @observable open = false

    constructor() {
        makeAutoObservable(this)

        setTimeout(() => {
            reaction(
                () => store.getAlerts,
                () => {
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
        console.log("toggleOpen", this.open)
        this.open = !this.open
    }

    @action setOpen(open: boolean) {
        this.open = open
    }
}

export const alertsAnchorViewModal = new AlertsAnchorVM()
