import {
    makeAutoObservable,
    observable,
    computed,
    action,
    reaction,
} from "mobx"
import { store } from "../../Store/store"

class NewsletterFilterVM {
    @observable isSubmitting = false
    @observable isFormChanged = false

    constructor() {
        makeAutoObservable(this)
    }

    @computed get initialFormValues() {
        return {
            "district-weekly":
                store.getWeeklyScheduleFilters["district-weekly"] || [],
            "weekly-event-type":
                store.getWeeklyScheduleFilters["weekly-event-type"] || [],
            "district-monthly":
                store.getWeeklyScheduleFilters["district-monthly"] || [],
            phone: store.getUser.phone,
        }
    }

    @computed get receiveWeeklySchedule() {
        return store.getReceiveWeeklySchedule
    }

    @action setIsSubmitting(value: boolean) {
        this.isSubmitting = value
    }

    @action setIsFormChanged(value: boolean) {
        this.isFormChanged = value
    }

    @action checkFormChanged(values: any) {
        const storeValues = {
            "district-weekly":
                store.getWeeklyScheduleFilters["district-weekly"] || [],
            "weekly-event-type":
                store.getWeeklyScheduleFilters["weekly-event-type"] || [],
            "district-monthly":
                store.getWeeklyScheduleFilters["district-monthly"] || [],
            phone: store.getUser.phone,
        }

        return !(
            this.areArraysEqual(
                values["district-weekly"] || [],
                storeValues["district-weekly"]
            ) &&
            this.areArraysEqual(
                values["weekly-event-type"] || [],
                storeValues["weekly-event-type"]
            ) &&
            this.areArraysEqual(
                values["district-monthly"] || [],
                storeValues["district-monthly"]
            ) &&
            values.phone === storeValues.phone
        )
    }

    private areArraysEqual(arr1: any[], arr2: any[]) {
        if (arr1.length !== arr2.length) return false
        const sortedArr1 = [...arr1].sort()
        const sortedArr2 = [...arr2].sort()
        return sortedArr1.every((val, idx) => val === sortedArr2[idx])
    }

    @action async submitForm(values: any) {
        this.setIsSubmitting(true)
        const weeklyScheduleFilters = {
            "district-weekly": values["district-weekly"] || [],
            "weekly-event-type": values["weekly-event-type"] || [],
            "district-monthly": values["district-monthly"] || [],
        }
        await store.setWeeklyScheduleFilters(
            weeklyScheduleFilters,
            values.phone
        )
        this.setIsFormChanged(false)
        this.setIsSubmitting(false)
    }

    @action toggleReceiveWeeklySchedule(checked: boolean) {
        store.toggleUserReceiveWeeklySchedule(store.user.id, checked)
    }
}

export const newsletterFilterVM = new NewsletterFilterVM()
