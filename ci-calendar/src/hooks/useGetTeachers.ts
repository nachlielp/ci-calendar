import { useEffect, useState } from "react";
import { DbTeacher } from "../util/interfaces";
import { useAuthContext } from "../Components/Auth/AuthContext";

interface TeacherBio {
    ids: string[];
}

export const useGetTeachers = ({ ids }: TeacherBio) => {
    const { getTeacher } = useAuthContext()
    const [teachers, setTeachers] = useState<DbTeacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getTeachers = async () => {
            const fetchedTeachers: DbTeacher[] = [];
            for (const id of ids) {
                try {
                    const teacher = await getTeacher(id);
                    if (teacher && teacher.showProfile) {
                        fetchedTeachers.push(teacher as DbTeacher);
                    }
                } catch (error) {
                    console.error("useGetTeachers.initTFirebase.error: ", error);
                    throw error;
                }
            }
            setTeachers(fetchedTeachers);
            setLoading(false);
        };
        getTeachers();
    }, []);
    return { teachers, loading };
};
