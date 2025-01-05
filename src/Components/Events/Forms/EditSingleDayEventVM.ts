import { makeAutoObservable, reaction, observable, action } from "mobx"
import { computed } from "mobx"
import { store } from "../../../Store/store"
import dayjs from "dayjs"
import { CIEvent, IAddress } from "../../../util/interfaces"

class EditSingleDayEventVM {
    @observable address: IAddress | null = null
    @observable startDate: dayjs.Dayjs = dayjs()
    @observable endDate: dayjs.Dayjs | null = null
    @observable isSubmitting = false
    @observable isInputErrors = false
    @observable selectedEventId: string | null = null
    @observable selectedEvents: CIEvent[] = []
    @observable updateRecurring: boolean = false

    constructor() {
        makeAutoObservable(this)

        reaction(
            () => this.selectedEventId,
            () => {
                console.log("___init EditSingleDayEventVM")
                if (this.selectedEventId)
                    this.selectedEvents = store.getFutureRecurringEvents(
                        this.selectedEventId
                    )
                else {
                    this.selectedEvents = []
                }
            }
        )
    }

    @computed
    get getSelectedEventId() {
        return this.selectedEventId
    }

    @computed
    get getAddress() {
        return this.address
    }

    @computed
    get getStartDate() {
        return this.startDate
    }

    @computed
    get getEndDate() {
        return this.endDate
    }

    @computed
    get getIsSubmitting() {
        return this.isSubmitting
    }

    @computed
    get getRecurringEvents() {
        if (this.selectedEventId) {
            return store.getFutureRecurringEvents(this.selectedEventId)
        } else {
            return []
        }
    }

    @computed
    get getSelectedEvents() {
        return this.selectedEvents
    }
    @computed
    get getSelectedEventsIds() {
        return this.selectedEvents.map((e) => e.id)
    }

    @computed
    get getUpdateRecurring() {
        return this.updateRecurring
    }

    @action
    get getIsInputError() {
        return this.isInputErrors
    }

    @action
    setAddress = (address: IAddress | null) => {
        this.address = address
    }

    @action
    setStartDate = (date: dayjs.Dayjs) => {
        this.startDate = date
    }

    @action
    setEndDate = (date: dayjs.Dayjs) => {
        this.endDate = date
    }

    @action
    setIsSubmitting = (isSubmitting: boolean) => {
        this.isSubmitting = isSubmitting
    }

    @action
    setIsInputError = (isError: boolean) => {
        this.isInputErrors = isError
    }

    @action
    updateSelectedEvent = (eventId: string) => {
        if (this.selectedEvents.some((e) => e.id === eventId)) {
            this.selectedEvents = this.selectedEvents.filter(
                (e) => e.id === eventId
            )
        } else {
            const event = store.getCIEventById(eventId)
            if (event) this.selectedEvents = [...this.selectedEvents, event]
        }
    }

    @action
    setSelectedEventId = (eventId: string | null) => {
        this.selectedEventId = eventId
    }

    @action
    setUpdateRecurring = (update: boolean) => {
        this.updateRecurring = update
    }
}

export const editSingleDayEventViewModal = new EditSingleDayEventVM()
