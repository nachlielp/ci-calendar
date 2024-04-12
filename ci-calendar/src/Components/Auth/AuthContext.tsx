import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase from "../../Firebase";
import { useNavigate } from "react-router-dom";
import { getUserByUid, insertUser } from "../../db";
import { DbUser, UserType } from "../../../drizzle/schema";
// import { userById } from "../../drizzle/index";
// import { Session } from "../../../drizzle/migrations/schema";
//Todo set user as type of AuthContext
// interface AuthContextType {}

interface IAuthContextType {
  currentUser: DbUser | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  githubLogin: () => Promise<void>;
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
  // const [userSessions, setUserSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  function signup(email: string, password: string) {
    return firebase.signUpWithEmail(email, password);
  }
  async function login(email: string, password: string) {
    const res = await firebase.signInWithEmail(email, password);
    if (res) {
      onUserLogin(res);
    }
  }
  function logout() {
    setCurrentUser(null);
    return firebase.logout();
  }
  async function googleLogin() {
    const res = await firebase.loginWithGoogle();
    if (res) {
      onUserLogin(res);
    }
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
      if (userRes) {
        const userObj: DbUser = { ...userRes, userType: UserType.user };
        setCurrentUser(userObj);
        navigate(`/`);
      }
    } catch (error) {
      console.error(`AuthContext.onUserLogin error:`, error);
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
      // if (user) {
      //   await getOrCreateDbUserByUser(user);
      // }
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    googleLogin,
    githubLogin,
    resetPassword,
    // userSessions,
  };
  //
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
