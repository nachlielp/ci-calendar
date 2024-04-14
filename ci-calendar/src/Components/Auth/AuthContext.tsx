import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase, { FbEvent } from "../../Firebase";
import { useNavigate } from "react-router-dom";
import {
  getSimpleEvents,
  getUserByUid,
  insertSimpleEvent,
  insertUser,
} from "../../db";
import {
  DbSimpleEvent,
  DbUser,
  District,
  EventType,
  UserType,
} from "../../../drizzle/schema";
import dayjs from "dayjs";

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
  logout: () => Promise<void>;
  googleLogin: () => Promise<UserCredential | void>;
  resetPassword: (email: string) => Promise<void>;
  createSimpleEvent: (event: DbSimpleEvent) => Promise<{ success: boolean }>;
  getAllEvents: () => Promise<FbEvent[]>;
}

const AuthContext = React.createContext<IAuthContextType | null>(null);

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  firebase: Firebase;
  children: any;
}

export function AuthProvider({ firebase, children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  async function signup(signupData: IUserSignup) {
    const signupRes = await firebase.signUpWithEmail(
      signupData.email,
      signupData.password
    );
    await getOrCreateDbUserByUser({
      ...signupRes.user,
      displayName: signupData.name,
    });
    return signupRes;
  }
  async function emailLogin(email: string, password: string) {
    await firebase.signInWithEmail(email, password);
  }
  function logout() {
    setCurrentUser(null);
    return firebase.logout();
  }
  async function googleLogin() {
    const res = await firebase.loginWithGoogle();
    console.log("AuthContext.googleLogin.res: ", res);
  }

  function resetPassword(email: string) {
    return firebase.resetPassword(email);
  }

  async function getOrCreateDbUserByUser(user: User) {
    try {
      const userRes = await firebase.getUserByUid(user.uid);
      console.log(`AuthContext.getOrCreateDbUserByUser.userRes:`, userRes);
      if (userRes === null) {
        console.log(`AuthContext.getOrCreateDbUserByUser.userRes:`, userRes);
        await firebase.addUser(user);
      }
      if (userRes) {
        const dbUser: DbUser = {
          id: userRes.id,
          name: userRes.name,
          userType: userRes.userType as UserType,
          email: userRes.email,
          bio: userRes.bio || "",
          receiveWeeklyEmails: userRes.receiveWeeklyEmails || false,
          linkToImage: userRes.linkToImage || "",
          linkToPage: userRes.linkToPage || "",
          createdAt: userRes.createdAt,
          updatedAt: userRes.updatedAt,
        };
        console.log(`AuthContext.getOrCreateDbUserByUser.dbUser:`, dbUser);
        setCurrentUser(dbUser);
        navigate(`/`);
      }
    } catch (error) {
      console.error(`AuthContext.getOrCreateDbUserByUser error:`, error);
    }
  }

  useEffect(() => {
    const unsubscribe = firebase.auth.onAuthStateChanged(async (user) => {
      setLoading(false);
      if (user) {
        await getOrCreateDbUserByUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  //TODO Update type
  async function createSimpleEvent(
    event: DbSimpleEvent
  ): Promise<{ success: boolean }> {
    try {
      await firebase.addEvent(event);
    } catch (error) {
      console.error(`AuthContext.createSimpleEvent error:`, error);
      throw error;
    }
    try {
      const eventRes = await insertSimpleEvent(event);
      return eventRes;
    } catch (error) {
      console.error(`AuthContext.createEvent error:`, error);
      throw error;
    }
  }

  async function getAllEvents(): Promise<FbEvent[]> {
    const startDate = dayjs().startOf("day").toISOString();
    try {
      const eventsRes = await firebase.getEventsAfter(
        dayjs().subtract(7, "day").toDate()
      );
    } catch (error) {
      console.error(`AuthContext.getAllEvents error:`, error);
      throw error;
    }
    try {
      const fbEvents = await firebase.getAllEvents();
      return fbEvents;
    } catch (error) {
      console.error(`AuthContext.getAllEvents error:`, error);
      throw error;
    }
  }
  const value = {
    currentUser,
    loading,
    signup,
    emailLogin,
    logout,
    googleLogin,
    resetPassword,
    createSimpleEvent,
    getAllEvents,
  };
  //
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
