import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
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
  updateDocument,
  subscribeToDoc,
} from "../../firebase.service";
import { DbUser, IEvently, UserType } from "../../util/interfaces";

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
  updateUser: (user: DbUser) => Promise<void>;
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
        subscribeToUserChanges(newUser.id);
        navigate(`/`);
      } else {
        userRes.userType = userRes.userType as UserType;
        setCurrentUser(userRes as unknown as DbUser);
        subscribeToUserChanges(userRes.id);
        navigate(`/`);
      }
    } catch (error) {
      console.error(`AuthContext.getOrCreateDbUserByUser error:`, error);
    }
  }

  async function updateUser(user: DbUser) {
    await updateDocument("users", user.id, user);
  }
  //TODO Update type
  async function createEvent(event: IEvently): Promise<void> {
    await addDocument("events", event);
  }

  async function deleteEvently(eventId: string) {
    await removeDocument("events", eventId);
  }

  function subscribeToUserChanges(userId: string) {
    const unsubscribe = subscribeToDoc(
      `users/${userId}`,
      (updatedUser: DbUser) => {
        setCurrentUser(updatedUser);
      }
    );
    return unsubscribe;
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
    deleteEvently,
    updateUser,
  };
  //
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
