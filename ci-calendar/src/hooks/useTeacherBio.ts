import { useEffect, useState } from "react";
import { firebaseService } from "../firebase.service";
import { DbUser } from "../util/interfaces";

interface TeacherBio {
    ids: string[];
}

export const useTeacherBio = ({ ids }: TeacherBio) => {
    const [teachers, setTeachers] = useState<DbUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initTFirebase = async () => {
            let teachers: DbUser[] = [];
            for (const id of ids) {
                const teacher = await firebaseService.getDocument('users', id);
                if (teacher && teacher.showProfile) {
                    console.log("teacher: ", teacher);
                    teachers.push(teacher as DbUser);
                }
            }
            setTeachers(teachers);
            setLoading(false);
        };
        initTFirebase();
    }, []);
    return { teachers, loading };
};
