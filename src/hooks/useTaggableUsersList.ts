import { useEffect, useState } from "react"

import { usersService } from "../supabase/usersService"
import { useUser } from "../context/UserContext"
import { UserType } from "../util/interfaces"

export const useTaggableUsersList = ({ addSelf }: { addSelf: boolean }) => {
    const [teachers, setTeachers] = useState<
        { label: string; value: string }[]
    >([])
    const [orgs, setOrgs] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useUser()

    useEffect(() => {
        if (!user) return
        const fetchTeachers = async () => {
            try {
                const users = await usersService.getTaggableUsers()
                const teachers = users
                    .filter((user) => user.user_type !== UserType.org)
                    .map((user) => ({
                        label: `${user.full_name}`,
                        value: user.user_id,
                    }))
                const orgs = users
                    .filter((user) => user.user_type === UserType.org)
                    .map((user) => ({
                        label: `${user.full_name}`,
                        value: user.user_id,
                    }))

                if (
                    !users
                        .map((teacher) => teacher.user_id)
                        .includes(user.user_id) &&
                    addSelf
                ) {
                    if (user.user_type === UserType.org) {
                        orgs.push({
                            label: `${user.full_name}`,
                            value: user.user_id,
                        })
                    } else {
                        teachers.push({
                            label: `${user.full_name}`,
                            value: user.user_id,
                        })
                    }
                }

                setTeachers(teachers)
                setOrgs(orgs)
                setLoading(false)
            } catch (error) {
                console.error("useTeachersList.fetchTeachers.error: ", error)
                setLoading(false)
            }
        }

        fetchTeachers()
    }, [])

    return { teachers, orgs, loading }
}
