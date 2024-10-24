import { useEffect, useState } from "react"
import { useTaggableUsersList } from "../../../hooks/useTaggableUsersList"
import { useUser } from "../../../context/UserContext"
import debounce from "lodash/debounce"
import { usersService } from "../../../supabase/usersService"
import DoubleBindedSelect from "./DoubleBindedSelectProps"
import Loading from "./Loading"

export default function SubscribeToTeachers() {
    const { user } = useUser()
    const { teachers, loading, orgs } = useTaggableUsersList({ addSelf: false })

    const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
        user?.subscriptions || []
    )
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
        user?.subscriptions || []
    )

    useEffect(() => {
        if (user) {
            console.log("user: ", user)
            setSelectedTeachers(
                user?.subscriptions.filter((sub) =>
                    teachers.map((t) => t.value).includes(sub)
                ) || []
            )
            setSelectedOrgs(
                user?.subscriptions.filter((sub) =>
                    orgs.map((o) => o.value).includes(sub)
                ) || []
            )
        }
    }, [])

    useEffect(() => {
        debouncedSaveFilters()
    }, [selectedTeachers, selectedOrgs])

    function debouncedSaveFilters() {
        const saveFilters = debounce(async () => {
            if (!user) {
                throw new Error(
                    "user is null, make sure you're within a Provider"
                )
            }
            try {
                await usersService.updateUser(user.user_id, {
                    subscriptions: [...selectedTeachers, ...selectedOrgs],
                })
            } catch (error) {
                console.error(
                    "SubscribeToTeachers.debouncedSaveFilters.error: ",
                    error
                )
            }
        }, 1000)

        saveFilters()
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
        </div>
    )
}
