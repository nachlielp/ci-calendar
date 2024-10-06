import { useEffect, useState } from "react"
import { ManageUserOption, userService } from "../supabase/userService"

export const useUsers = () => {
    const [users, setUsers] = useState<ManageUserOption[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const users = await userService.getUsers()
                setUsers(users)
                setLoading(false)
            } catch (error) {
                console.error("useTeachersList.fetchTeachers.error: ", error)
                setLoading(false)
            }
        }

        fetchTeachers()
    }, [])

    return { users, loading }
}
