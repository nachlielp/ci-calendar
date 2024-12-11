import { useState } from "react"
import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import AsyncButton from "../Common/AsyncButton"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import { makeObservable, observable, reaction, computed, action } from "mobx"

class SubscribeToTeachersVM {
    @observable isSubmitting = false
    @observable selectedTeachers: string[] =
        store.getUser.subscriptions.teachers?.filter((id) =>
            store.getPublicTeacherBios.some((t) => t.value === id)
        ) || []
    @observable selectedOrgs: string[] =
        store.getUser.subscriptions.orgs?.filter((id) =>
            store.getPublicOrgBios.some((o) => o.value === id)
        ) || []

    constructor() {
        makeObservable(this)

        reaction(
            () => store.getUser.subscriptions,
            () => {
                this.selectedTeachers =
                    store.getUser.subscriptions.teachers?.filter((id) =>
                        store.getPublicTeacherBios.some((t) => t.value === id)
                    ) || []
                this.selectedOrgs =
                    store.getUser.subscriptions.orgs?.filter((id) =>
                        store.getPublicOrgBios.some((o) => o.value === id)
                    ) || []
            }
        )
    }

    @computed
    get subscriptionsEqual() {
        return (
            JSON.stringify([...this.selectedTeachers].sort()) ===
                JSON.stringify(
                    [...(store.getUser.subscriptions.teachers || [])].sort()
                ) &&
            JSON.stringify([...this.selectedOrgs].sort()) ===
                JSON.stringify(
                    [...(store.getUser.subscriptions.orgs || [])].sort()
                )
        )
    }
    @action
    saveSubscriptions = async () => {
        this.isSubmitting = true
        await store.updateUser({
            subscriptions: {
                teachers: this.selectedTeachers,
                orgs: this.selectedOrgs,
            },
        })
        this.isSubmitting = false
    }

    @action
    setSelectedTeachers = (teachers: string[]) => {
        this.selectedTeachers = teachers
    }

    @action
    setSelectedOrgs = (orgs: string[]) => {
        this.selectedOrgs = orgs
    }
}

const SubscribeToTeachers = () => {
    //TODO ask Juan
    const [vm] = useState(() => new SubscribeToTeachersVM())

    return (
        <div>
            <label style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                הרשמה להתראות על ארועים חדשים של מורים וארגונים
            </label>
            <DoubleBindedSelect
                options={store.getPublicTeacherBios}
                selectedValues={vm.selectedTeachers}
                onChange={(values: string[]) => {
                    const selectedTeachers = values
                    vm.setSelectedTeachers(selectedTeachers)
                }}
                placeholder="בחירת מורים"
                className="select-filter"
            />
            <DoubleBindedSelect
                options={store.getPublicOrgBios}
                selectedValues={vm.selectedOrgs}
                onChange={(values: string[]) => {
                    const selectedOrgs = values
                    vm.setSelectedOrgs(selectedOrgs)
                }}
                placeholder="בחירת ארגונים"
                className="select-filter"
            />
            <AsyncButton
                className="general-action-btn large-btn"
                isSubmitting={vm.isSubmitting}
                callback={vm.saveSubscriptions}
                disabled={vm.subscriptionsEqual}
            >
                שמירה
            </AsyncButton>
        </div>
    )
}

export default observer(SubscribeToTeachers)
