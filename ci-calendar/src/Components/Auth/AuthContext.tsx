import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase, { DbUser, UserType } from "../../Firebase";
import { useNavigate } from "react-router-dom";
import { IEvent } from "../UI/EventForm";
import {
  firebaseService,
  signinGoogle,
  logout,
  onAuthChanged,
  getDocuments,
  addDocument,
  getDocument,
  signupEmail,
  signinEmail,
  resetEmailPassword,
} from "../../firebase.service";

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
  createEvent: (event: IEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getAllEvents: () => Promise<IEvent[]>;
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

  function resetPassword(email: string) {
    resetEmailPassword(email);
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
  async function createEvent(event: IEvent): Promise<void> {
    return {} as unknown as void;
    // try {
    //   await firebase.addEvent(event);
    // } catch (error) {
    //   console.error(`AuthContext.createEvent error:`, error);
    //   throw error;
    // }
  }

  async function getAllEvents(): Promise<IEvent[]> {
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
    return {} as IEvent[];
  }

  async function deleteEvent(eventId: string) {
    // await firebase.deleteEvent(eventId);
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
    deleteEvent,
  };
  //
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
