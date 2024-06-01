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
  removeMultipleDocuments,
  addDocumentIfNotExists,
  getTeachersAndAdminsList,
  addOrActivateTeacher,
} from "../../firebase.service";
import { DbTeacher, DbUser, IEvently, UserType } from "../../util/interfaces";

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
  getEvent: (eventId: string) => Promise<IEvently | null>;
  updateEvent: (eventId: string, event: IEvently) => Promise<void>;
  hideEvent: (eventId: string, hide: boolean) => Promise<void>;
  deleteMultipleEventlys: (eventIds: string[]) => Promise<void>;
  hideOrShowMultipleEventlys: (eventIds: string[], hide: boolean) => Promise<void>;
  addTeacher: (teacher: DbTeacher) => Promise<void>;
  disableTeacher: (teacherId: string) => Promise<void>;
  updateTeacher: (teacher: DbTeacher) => Promise<void>;
  getTeacher: (teacherId: string) => Promise<DbTeacher | null>;
  getTeachersList: () => Promise<{ label: string; value: string }[]>;
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
  children: any;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe = () => { };
    const initAuth = async () => {
      try {
        unsubscribe = await onAuthChanged(async (user: User) => {
          setLoading(false);
          if (user) {
            await getOrCreateDbUserByUser(user);
          } else {
            setCurrentUser(null);
          }
        });
      } catch (error) {
        console.error("AuthContext.initAuth.error: ", error);
      }
    }

    initAuth();

    return () => {
      unsubscribe();
    };
  }, []);

  async function signup(signupData: IUserSignup) {
    try {
      const signupRes = await signupEmail(signupData.email, signupData.password);
      await getOrCreateDbUserByUser({
        ...signupRes.user,
        displayName: signupData.name,
      });
      return signupRes;
    } catch (error) {
      console.error("AuthContext.signup.error: ", error);
      throw error;
    }
  }

  async function emailLogin(email: string, password: string) {
    try {
      const signinRes = await signinEmail(email, password);
      await getOrCreateDbUserByUser(signinRes.user);
    } catch (error) {
      console.error("AuthContext.emailLogin.error: ", error);
      throw error;
    }
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
          fullName: user.displayName || "",
          userType: UserType.user,
          email: user.email || "",
          newsletter: false,
          subscribedForUpdatesAt: "",
          phoneNumber: "",
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
    try {
      await updateDocument("users", user.id, user);
    } catch (error) {
      console.error("AuthContext.updateUser.error: ", error);
      throw error;
    }
  }
  //TODO Update type
  async function createEvent(event: IEvently): Promise<void> {
    try {
      await addDocument("events", event);
    } catch (error) {
      console.error("AuthContext.createEvent.error: ", error);
      throw error;
    }
  }

  async function deleteEvently(eventId: string) {
    try {
      await removeDocument("events", eventId);
    } catch (error) {
      console.error("AuthContext.deleteEvently.error: ", error);
      throw error;
    }
  }

  async function deleteMultipleEventlys(eventIds: string[]) {
    try {
      await removeMultipleDocuments("events", eventIds);
    } catch (error) {
      console.error("AuthContext.deleteMultipleEventlys.error: ", error);
      throw error;
    }
  }

  async function getEvent(eventId: string) {
    try {
      const eventDoc = await getDocument("events", eventId);
      if (eventDoc) {
        return eventDoc as IEvently;
      }
      return null;
    } catch (error) {
      console.error("AuthContext.getEvent.error: ", error);
      throw error;
    }
  }

  async function updateEvent(eventId: string, event: IEvently) {
    try {
      await updateDocument("events", eventId, event);
    } catch (error) {
      console.error("AuthContext.updateEvent.error: ", error);
      throw error;
    }
  }

  async function hideEvent(eventId: string, hide: boolean) {
    try {
      const event = await getEvent(eventId);
      if (event) {
        event.hide = hide;
        await updateEvent(eventId, event);
      }
    } catch (error) {
      console.error("AuthContext.hideEvent.error: ", error);
      throw error;
    }
  }

  async function hideOrShowMultipleEventlys(eventIds: string[], hide: boolean) {
    console.log("eventIds to hide: ", eventIds)
    eventIds.forEach(async (eventId) => {
      try {
        await hideEvent(eventId, hide);
      } catch (error) {
        console.error("AuthContext.hideOrShowMultipleEventlys.error: ", error);
        throw error;
      }
    });
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


  async function getTeacher(teacherId: string) {
    try {
      const teacherDoc = await getDocument("teachers", teacherId);
      if (teacherDoc) {
        return teacherDoc as DbTeacher;
      }
      return null;
    } catch (error) {
      console.error("AuthContext.getTeacher.error: ", error);
      throw error;
    }
  }
  async function addTeacher(teacher: DbTeacher) {
    try {
      await addOrActivateTeacher(teacher);
    } catch (error) {
      console.error("AuthContext.createTeacher.error: ", error);
      throw error;
    }
  }

  async function disableTeacher(teacherId: string) {
    try {
      await updateDocument("teachers", teacherId, { allowTagging: false, showProfile: false });
    } catch (error) {
      console.error("AuthContext.disableTeacher.error: ", error);
      throw error;
    }
  }

  async function updateTeacher(teacher: DbTeacher) {
    try {
      await updateDocument("teachers", teacher.id, teacher);
    } catch (error) {
      console.error("AuthContext.updateTeacher.error: ", error);
      throw error;
    }
  }

  async function getTeachersList() {
    const teachers = await getTeachersAndAdminsList();
    return teachers;
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
    getEvent,
    updateEvent,
    hideEvent,
    deleteMultipleEventlys,
    hideOrShowMultipleEventlys,
    addTeacher,
    disableTeacher,
    updateTeacher,
    getTeacher,
    getTeachersList,
  };
  //
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
