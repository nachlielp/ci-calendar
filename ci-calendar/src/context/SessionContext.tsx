import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { Session } from "@supabase/supabase-js";
import Loading from "../Components/UI/Other/Loading";
import { useUser } from "./UserContext";

const SessionContext = createContext<{
  session: Session | null;
}>({
  session: null,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

type Props = { children: React.ReactNode };
export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setUser } = useUser();

  useEffect(() => {
    const authStateListener = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => {
      authStateListener.data.subscription.unsubscribe();
    };
  }, [setUser]);

  return (
    <SessionContext.Provider value={{ session }}>
      {isLoading ? <Loading /> : children}
    </SessionContext.Provider>
  );
};
