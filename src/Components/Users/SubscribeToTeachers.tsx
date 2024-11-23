import { useEffect, useState } from "react"
import { usersService } from "../../supabase/usersService"
import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import AsyncButton from "../Common/AsyncButton"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const SubscribeToTeachers = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [subscriptionsEqual, setSubscriptionsEqual] = useState(false)
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])

    useEffect(() => {
        setSelectedTeachers(
            store.getUser.subscriptions.teachers?.filter((id) =>
                store.getPublicTeacherBios.some((t) => t.value === id)
            ) || []
        )
        setSelectedOrgs(
            store.getUser.subscriptions.orgs?.filter((id) =>
                store.getPublicOrgBios.some((o) => o.value === id)
            ) || []
        )
    }, [store.getUser.subscriptions.teachers, store.getUser.subscriptions.orgs])

    useEffect(() => {
        setSubscriptionsEqual(isSubscriptionsEqual())
    }, [selectedTeachers, selectedOrgs])

    async function saveSubscriptions() {
        try {
            setIsSubmitting(true)
            const updatedUser = await usersService.updateUser(store.getUserId, {
                subscriptions: {
                    teachers: [...selectedTeachers],
                    orgs: [...selectedOrgs],
                },
            })
            if (updatedUser) {
                store.setUser(updatedUser)
                setSubscriptionsEqual(true)
            }
        } catch (error) {
            console.error(
                "SubscribeToTeachers.debouncedSaveFilters.error: ",
                error
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    function isSubscriptionsEqual() {
        const currentTeachers = store.getUser.subscriptions.teachers
        const currentOrgs = store.getUser.subscriptions.orgs

        return (
            JSON.stringify(currentTeachers?.sort()) ===
                JSON.stringify(selectedTeachers.sort()) &&
            JSON.stringify(currentOrgs?.sort()) ===
                JSON.stringify(selectedOrgs.sort())
        )
    }

    return (
        <div>
            <DoubleBindedSelect
                options={store.getPublicTeacherBios}
                selectedValues={selectedTeachers}
                onChange={(values: string[]) => {
                    const selectedTeachers = values
                    setSelectedTeachers(selectedTeachers)
                }}
                placeholder="בחירת מורים"
                className="select-filter"
            />
            <DoubleBindedSelect
                options={store.getPublicOrgBios}
                selectedValues={selectedOrgs}
                onChange={(values: string[]) => {
                    const selectedOrgs = values
                    setSelectedOrgs(selectedOrgs)
                }}
                placeholder="בחירת ארגונים"
                className="select-filter"
            />
            <AsyncButton
                isSubmitting={isSubmitting}
                callback={saveSubscriptions}
                disabled={subscriptionsEqual}
            >
                שמירה
            </AsyncButton>
        </div>
    )
}

export default observer(SubscribeToTeachers)
