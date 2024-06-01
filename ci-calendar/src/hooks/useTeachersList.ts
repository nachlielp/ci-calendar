import { useEffect, useState } from "react";
import { useAuthContext } from "../Components/Auth/AuthContext";

export const useTeachersList = () => {
    const [teachers, setTeachers] = useState<{ label: string, value: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const { getTeachersList } = useAuthContext();
    useEffect(() => {
        const initTFirebase = async () => {
            try {
                const teacheres = await getTeachersList();
                setTeachers(teacheres);
                setLoading(false);
            } catch (error) {
                console.error("useTeachersList.initTFirebase.error: ", error);
                throw error;
            }
        };
        initTFirebase();
    }, []);
    return { teachers, loading };
};
