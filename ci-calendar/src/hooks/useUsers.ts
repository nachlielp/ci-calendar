import { useEffect, useState } from "react";
import { firebaseService } from "../firebase.service";
import { DbUser } from "../util/interfaces";

export const useUsers = () => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initTFirebase = async () => {
      firebaseService.initFirebaseJS();
      firebaseService.subscribeToCollection("users", (users: any) => {
        setUsers(users);
        setLoading(false);
      });
    };
    initTFirebase();
  }, []);
  return { users, loading };
};
