import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase from "../../Firebase";
import { useNavigate } from "react-router-dom";
import { getEvents, getUserByUid, insertEvent, insertUser } from "../../db";
import {
  DbEvent,
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
  githubLogin: () => Promise<UserCredential | void>;
  resetPassword: (email: string) => Promise<void>;
  createEvent: (event: DbEvent) => Promise<{ success: boolean }>;
  getAllEvents: () => Promise<DbEvent[]>;
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
    await createUserInDb({ ...signupRes.user, displayName: signupData.name });
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
    await firebase.loginWithGoogle();
  }
  async function githubLogin() {
    const res = await firebase.loginWithGithub();
    if (res) {
      onUserLogin(res);
    }
  }
  function resetPassword(email: string) {
    return firebase.resetPassword(email);
  }

  async function getOrCreateDbUserByUser(user: User) {
    try {
      const userRes = await getUserByUid(user.uid);
      if (userRes === undefined) {
        await createUserInDb(user);
      }
      const userType = userRes?.userType as UserType;
      if (userRes) {
        const userObj: DbUser = { ...userRes, userType: userType };
        setCurrentUser(userObj);
        navigate(`/`);
      }
    } catch (error) {
      console.error(`AuthContext.onUserLogin error:`, error);
    }
  }

  async function createUserInDb(user: User) {
    try {
      const userObj: DbUser = {
        id: user.uid,
        name: user.displayName || "",
        userType: UserType.user,
        email: user.email || "",
        bio: "",
        receiveWeeklyEmails: false,
        linkToImage: "",
        linkToPage: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const userRes = await insertUser(userObj);

      if (userRes) {
        setCurrentUser(userRes);
        navigate(`/`);
      }
      console.log(`AuthContext.onUserLogin.insertUser user:`, userRes);
    } catch (error) {
      console.error(`AuthContext.onUserLogin.insertUser error:`, error);
    }
  }

  async function onUserLogin(res: UserCredential) {
    try {
      await getOrCreateDbUserByUser(res.user);
    } catch (error) {
      console.error(`AuthContext.onUserLogin error:`, error);
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

  async function createEvent(event: DbEvent): Promise<{ success: boolean }> {
    const modifiedEvent = {
      ...event,
      owners: event.owners.join(", "),
      types: event.types.join(", "),
    };
    try {
      const eventRes = await insertEvent(modifiedEvent);
      return eventRes;
    } catch (error) {
      console.error(`AuthContext.createEvent error:`, error);
      throw error;
    }
  }

  async function getAllEvents(): Promise<DbEvent[]> {
    console.log("AuthContext.getAllEvents");
    const startDate = dayjs().subtract(6, "month").toISOString();
    const endDate = dayjs().add(6, "month").toISOString();

    try {
      const events = await getEvents(startDate, endDate);
      if (events) {
        console.log(
          `AuthContext.getAllEvents.event[0]:`,
          JSON.stringify(events[1]["subEvents"])
        );
        return events.map((event) => ({
          ...event,
          owners: event.owners.split(", "),
          types: event.types.split(", ").map((type) => type as EventType),
          linkToEvent: event.linkToEvent || "",
          linkToPayment: event.linkToPayment || "",
          district: event.district as District,
          hideEvent: event.hideEvent || false,
          limitations:
            typeof event.limitations === "string"
              ? event.limitations.split(", ")
              : [],
          subEvents:
            typeof event.subEvents === "string"
              ? safelyParseJSON(event.subEvents)
              : [],
          registration: event.registration || false,
          linkToRegistration: event.linkToRegistration || "",
        }));
      }
      return [];
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
    githubLogin,
    resetPassword,
    createEvent,
    getAllEvents,
  };
  //
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
function safelyParseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString).map((subEvent: any) => ({
      ...subEvent,
    }));
  } catch (error) {
    console.error(`AuthContext.safelyParseJSON error:`, error);
    return [];
  }
}
