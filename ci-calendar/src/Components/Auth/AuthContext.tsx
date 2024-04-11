import React, { useState, useContext, useEffect } from "react";
import { User, UserCredential } from "firebase/auth";
import Firebase from "../../Firebase";
import { useNavigate } from "react-router-dom";
// import { userById } from "../../drizzle/index";
// import { Session } from "../../../drizzle/migrations/schema";
//Todo set user as type of AuthContext
// interface AuthContextType {}

const AuthContext = React.createContext<any | undefined>(undefined);

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  firebase: Firebase;
  children: any;
}

export function AuthProvider({ firebase, children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>();
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
  async function onUserLogin(res: UserCredential) {
    `BU-${res.user.uid}`;
    // const user = await userById(`BU-${res.user.uid}`);
    // if (user?.sessions) {
    //   setUserSessions(user.sessions as Session[]);
    // }

    navigate(`/`);
  }
  useEffect(() => {
    const unsubscribe = firebase.auth.onAuthStateChanged((user) => {
      setLoading(false);
      setCurrentUser(user);
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
