import { useEffect, useState } from "react"

import { usersService } from "../supabase/usersService"
import { UserType } from "../util/interfaces"
import { store } from "../Store/store"

//TODO add to view model
export const useTaggableUsersList = ({ addSelf }: { addSelf: boolean }) => {
    const [teachers, setTeachers] = useState<
        { label: string; value: string }[]
    >([])
    const [orgs, setOrgs] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(true)
    const hasProfile = !!store.getBio.bio_name && store.getBio.bio_name !== ""

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const users = await usersService.getTaggableUsers()

                const teachers = users
                    .filter((user) => user.user_type !== UserType.org)
                    .map((user) => ({
                        label: `${user.bio_name}`,
                        value: user.user_id,
                    }))
                const orgs = users
                    .filter((user) => user.user_type === UserType.org)
                    .map((user) => ({
                        label: `${user.bio_name}`,
                        value: user.user_id,
                    }))

                if (
                    !users
                        .map((teacher) => teacher.user_id)
                        .includes(store.getUser.user_id) &&
                    addSelf &&
                    hasProfile
                ) {
                    if (store.getUser.user_type === UserType.org) {
                        orgs.push({
                            label: `${store.getBio.bio_name}`,
                            value: store.getUser.user_id,
                        })
                    } else {
                        teachers.push({
                            label: `${store.getBio.bio_name}`,
                            value: store.getUser.user_id,
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
