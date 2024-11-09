import { useEffect, useState } from "react"
import { useUser } from "../../context/UserContext"
import debounce from "lodash/debounce"
import { usersService } from "../../supabase/usersService"
import DoubleBindedSelect from "../Common/DoubleBindedSelect"
import Loading from "../Common/Loading"
import { usePublicBioList } from "../../hooks/usePublicBioList"

export default function SubscribeToTeachers() {
    const { user } = useUser()
    const { teachers, loading, orgs } = usePublicBioList()
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
        user?.subscriptions.teachers || []
    )
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
        user?.subscriptions.orgs || []
    )

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
                    subscriptions: {
                        teachers: [...selectedTeachers],
                        orgs: [...selectedOrgs],
                    },
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
