import { useEffect, useState } from "react";
import { firebaseService } from "../firebase.service";

export const useTeachersList = () => {
    const [teachers, setTeachers] = useState<{ label: string, value: string }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initTFirebase = async () => {
            const teacheres = await firebaseService.getTeachersAndAdminsList();
            setTeachers(teacheres);
            setLoading(false);
        };
        initTFirebase();
    }, []);
    return { teachers, loading };
};
