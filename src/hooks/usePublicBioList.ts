import { useEffect, useState } from "react"
import { usersService } from "../supabase/usersService"
import { UserType } from "../util/interfaces"

//TODO add to view model
export const usePublicBioList = () => {
    const [teachers, setTeachers] = useState<
        { label: string; value: string }[]
    >([])
    const [orgs, setOrgs] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const public_bios = await usersService.getPublicBioList()
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
