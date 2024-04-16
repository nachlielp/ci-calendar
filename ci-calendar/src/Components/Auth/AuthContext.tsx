import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import { DbUser, UserType } from "../../Firebase";
import { useNavigate } from "react-router-dom";
import {
  signinGoogle,
  logout,
  onAuthChanged,
  addDocument,
  getDocument,
  signupEmail,
  signinEmail,
  resetEmailPassword,
  removeDocument,
} from "../../firebase.service";
import { IEvently } from "../../util/interfaces";

export interface IUserSignup {
  email: string;
  password: string;
  name: string;
}
interface IAuthContextType {
  currentUser: DbUser | null;
  loading: boolean;
  signup: (signupData: IUserSignup) => Promise<UserCredential>;
  emailLogin: (email: string, password: string) => Promise<void>;
  logoutContext: () => Promise<void>;
  googleLogin: () => Promise<UserCredential | void>;
  resetPassword: (email: string) => Promise<void>;
  createEvent: (event: IEvently) => Promise<void>;
  deleteEvently: (eventId: string) => Promise<void>;
  getAllEvents: () => Promise<IEvently[]>;
}

const AuthContext = React.createContext<IAuthContextType | null>(null);

// export function useAuthContext() {
//   return useContext(AuthContext);
// }
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  // firebase: Firebase;
  children: any;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Optionally handle automatic session persistence here
    // const unsubscribe = firebaseService.subscribe("users", (users: User) => {
    //   console.log("AuthContext.useEffect.users: ", users);
    // });
  }, [currentUser]);

  async function signup(signupData: IUserSignup) {
    const signupRes = await signupEmail(signupData.email, signupData.password);
    await getOrCreateDbUserByUser({
      ...signupRes.user,
      displayName: signupData.name,
    });
    return signupRes;
  }

  async function emailLogin(email: string, password: string) {
    const signinRes = await signinEmail(email, password);
    await getOrCreateDbUserByUser(signinRes.user);
  }

  async function logoutContext() {
    setCurrentUser(null);
    try {
      await logout();
    } catch (error) {
      console.error(`AuthContext.logout error:`, error);
      throw error;
    }
  }

  async function googleLogin() {
    signinGoogle();
  }

  function resetPassword(email: string): Promise<void> {
    return resetEmailPassword(email);
  }

  async function getOrCreateDbUserByUser(user: User) {
    try {
      const userRes = await getDocument("users", user.uid);
      if (userRes === null) {
        const newUser: DbUser = {
          id: user.uid,
          name: user.displayName || "",
          userType: UserType.user,
          email: user.email || "",
          bio: "",
          newsletter: false,
          image: "",
          page: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await addDocument("users", newUser);
        setCurrentUser(newUser);
        navigate(`/`);
      } else {
        userRes.userType = userRes.userType as UserType;
        setCurrentUser(userRes as unknown as DbUser);
        navigate(`/`);
      }
    } catch (error) {
      console.error(`AuthContext.getOrCreateDbUserByUser error:`, error);
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      unsubscribe = await onAuthChanged(async (user: User) => {
        setLoading(false);
        if (user) {
          await getOrCreateDbUserByUser(user);
        } else {
          setCurrentUser(null);
        }
      });
    };
    initAuth();

    let unsubscribe = () => {};
    return () => {
      unsubscribe();
    };
  }, []);

  //TODO Update type
  async function createEvent(event: IEvently): Promise<void> {
    await addDocument("events", event);
    // try {
    //   await firebase.addEvent(event);
    // } catch (error) {
    //   console.error(`AuthContext.createEvent error:`, error);
    //   throw error;
    // }
  }

  async function getAllEvents(): Promise<IEvently[]> {
    // const startDate = dayjs().startOf("day").toISOString();
    try {
      // const eventsRes = await firebase.getEventsAfter(
      //   dayjs().subtract(7, "day").toDate()
      // );
    } catch (error) {
      console.error(`AuthContext.getAllEvents error:`, error);
      throw error;
    }
    try {
      // const fbEvents = await firebase.getAllEvents();
      // return fbEvents;
    } catch (error) {
      console.error(`AuthContext.getAllEvents error:`, error);
      throw error;
    }
    return {} as IEvently[];
  }

  async function deleteEvently(eventId: string) {
    console.log("AuthContext.deleteEvent.eventId: ", eventId);
    await removeDocument("events", eventId);
  }
  const value = {
    currentUser,
    loading,
    signup,
    emailLogin,
    logoutContext,
    googleLogin,
    resetPassword,
    createEvent,
    getAllEvents,
    deleteEvently,
  };
  //
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
