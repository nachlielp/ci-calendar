import { useEffect, useState } from "react";
import { DbTeacher } from "../util/interfaces";
import { useAuthContext } from "../Components/Auth/AuthContext";

export function useGetTeacher(id: string) {
    const { getTeacher } = useAuthContext();
    const [teacher, setTeacher] = useState<DbTeacher | null>(null);
    useEffect(() => {
        const fetchTeacher = async () => {
            const teacher = await getTeacher(id);
            setTeacher(teacher);
        };
        fetchTeacher();
    }, []);
    return teacher;
}