import { useEffect, useState } from "react"

import { usersService } from "../supabase/usersService"
import { useUser } from "../context/UserContext"
import { UserType } from "../util/interfaces"

export const usePublicBioList = () => {
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
                const public_bios = await usersService.getPublicBioList()
                console.log("public_bios", public_bios)
                const teachers = public_bios
                    .filter((user) => user.user_type !== UserType.org)
                    .map((user) => ({
                        label: `${user.bio_name}`,
                        value: user.user_id,
                    }))
                const orgs = public_bios
                    .filter((user) => user.user_type === UserType.org)
                    .map((user) => ({
                        label: `${user.bio_name}`,
                        value: user.user_id,
                    }))

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