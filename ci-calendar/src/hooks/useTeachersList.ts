import { useEffect, useState } from "react"

import { userService } from "../supabase/userService"

export const useTeachersList = () => {
    const [teachers, setTeachers] = useState<
        { label: string; value: string }[]
    >([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const teachers = await userService.getTaggableTeachers()
                console.log("useTeachersList.teachers: ", teachers)
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
