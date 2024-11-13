import { useEffect, useState } from "react"
import { useUser } from "../../context/UserContext"
import { usersService } from "../../supabase/usersService"
import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import Loading from "../Common/Loading"
import { usePublicBioList } from "../../hooks/usePublicBioList"
import AsyncButton from "../Common/AsyncButton"

export default function SubscribeToTeachers() {
    const { user } = useUser()
    const { teachers, loading, orgs } = usePublicBioList()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [subscriptionsEqual, setSubscriptionsEqual] = useState(false)
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])

    useEffect(() => {
        if (loading) return
        setSelectedTeachers(
            user?.subscriptions.teachers?.filter((id) =>
                teachers.some((t) => t.value === id)
            ) || []
        )
        setSelectedOrgs(
            user?.subscriptions.orgs?.filter((id) =>
                orgs.some((o) => o.value === id)
            ) || []
        )
    }, [loading])

    useEffect(() => {
        setSubscriptionsEqual(isSubscriptionsEqual())
    }, [selectedTeachers, selectedOrgs])

    async function saveFilters() {
        if (!user) {
            throw new Error("user is null, make sure you're within a Provider")
        }

        try {
            setIsSubmitting(true)
            await usersService.updateUser(user.user_id, {
                subscriptions: {
                    teachers: [...selectedTeachers],
                    orgs: [...selectedOrgs],
                },
            })
            setSubscriptionsEqual(true)
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
        if (!user) {
            throw new Error("user is null, make sure you're within a Provider")
        }

        const currentTeachers = user?.subscriptions.teachers
        const currentOrgs = user?.subscriptions.orgs

        return (
            JSON.stringify(currentTeachers?.sort()) ===
                JSON.stringify(selectedTeachers.sort()) &&
            JSON.stringify(currentOrgs?.sort()) ===
                JSON.stringify(selectedOrgs.sort())
        )
    }

    if (loading) {
        return <Loading />
    }

    return (
        <div>
            <DoubleBindedSelect
                options={teachers}
                selectedValues={selectedTeachers}
                onChange={(values: string[]) => {
                    const selectedTeachers = values
                    setSelectedTeachers(selectedTeachers)
                }}
                placeholder="בחירת מורים"
                className="select-filter"
            />
            <DoubleBindedSelect
                options={orgs}
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
                callback={saveFilters}
                disabled={subscriptionsEqual}
            >
                שמירה
            </AsyncButton>
        </div>
    )
}
