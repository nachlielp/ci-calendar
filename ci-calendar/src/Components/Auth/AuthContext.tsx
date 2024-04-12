import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase from "../../Firebase";
import { useNavigate } from "react-router-dom";
import { getUserByUid, insertUser } from "../../db";
import { DbUser, UserType } from "../../../drizzle/schema";

export interface IUserSignup {
  email: string;
  password: string;
  name: string;
}
interface IAuthContextType {
  currentUser: DbUser | null;
  signup: (signupData: IUserSignup) => Promise<UserCredential>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<UserCredential | void>;
  githubLogin: () => Promise<UserCredential | void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = React.createContext<IAuthContextType | null>(null);

export function useAuth() {
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
      if (userRes) {
        const userObj: DbUser = { ...userRes, userType: UserType.user };
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

  const value = {
    currentUser,
    signup,
    login: emailLogin,
    logout,
    googleLogin,
    githubLogin,
    resetPassword,
  };
  //
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
