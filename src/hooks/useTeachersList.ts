import { useEffect, useState } from "react"

import { usersService } from "../supabase/usersService"

export const useTeachersList = () => {
    const [teachers, setTeachers] = useState<
        { label: string; value: string }[]
    >([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const teachers = await usersService.getTaggableTeachers()
                setTeachers(teachers)
                setLoading(false)
            } catch (error) {
                console.error("useTeachersList.fetchTeachers.error: ", error)
                setLoading(false)
            }
        }

        fetchTeachers()
    }, [])

    return { teachers, loading }
}
