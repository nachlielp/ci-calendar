import { useEffect, useState } from "react"
import { useTeachersList } from "../../../hooks/useTeachersList"
import { useUser } from "../../../context/UserContext"
import debounce from "lodash/debounce"
import { usersService } from "../../../supabase/usersService"
import DoubleBindedSelect from "./DoubleBindedSelectProps"

export default function SubscribeToTeachers() {
    const { user } = useUser()
    const { teachers } = useTeachersList({ addSelf: false })
    console.log("teachers: ", teachers)
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
        user?.subscriptions || []
    )

    useEffect(() => {
        debouncedSaveFilters()
    }, [selectedTeachers])

    function debouncedSaveFilters() {
        const saveFilters = debounce(async () => {
            if (!user) {
                throw new Error(
                    "user is null, make sure you're within a Provider"
                )
            }
            try {
                await usersService.updateUser(user.user_id, {
                    subscriptions: selectedTeachers,
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
        </div>
    )
}
