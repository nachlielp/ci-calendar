import { createContext, useContext, useEffect, useState } from "react";
import { DbUser } from "../util/interfaces";
import { supabase } from "../supabase/client";
import { useSession } from "./SessionContext";
import { userService } from "../supabase/userService";
import { utilService } from "../util/utilService";
interface IUserContextType {
  user: DbUser | null;
  setUser: (user: DbUser | null) => void;
  loading: boolean;
}

const UserContext = createContext<IUserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
});

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { session } = useSession();

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          const user = await userService.getUser(data.user.id);
          if (user) {
            setUser(user);
          } else {
            const newUser = utilService.createDbUserFromUser(data.user);
            await userService.createUser(newUser);
            setUser(newUser);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, [session]);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
