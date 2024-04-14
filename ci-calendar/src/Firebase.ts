import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { Database } from "firebase/database";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { UserType } from "../drizzle/schema";
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export default class Firebase {
  path!: string;
  firebaseConfig: FirebaseConfig;
  app: FirebaseApp;
  database!: Database;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
  db: Firestore;

  constructor() {
    this.firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
    };

    this.app = initializeApp(this.firebaseConfig);
    this.auth = getAuth(this.app);
    this.googleProvider = new GoogleAuthProvider();
    this.db = getFirestore(this.app);
  }

  getAuth() {
    return this.auth;
  }
  getGoogleProvider() {
    return this.googleProvider;
  }

  async signUpWithEmail(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      console.error("Error signing up with email and password:", error);
      throw error;
    }
  }

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<UserCredential | void> {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      if (result && result.user) {
        return result;
      }
    } catch (error) {
      console.error("Firebase.signInWithEmail.e: ", error);
    }
  }
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  }
  async loginWithGoogle(): Promise<UserCredential | void> {
    try {
      const result = await signInWithPopup(
        this.getAuth(),
        this.getGoogleProvider()
      );
      if (result && result.user) {
        return result;
      }
    } catch (error) {
      console.error("Firebase.loginWithGoogle.e: ", error);
    }
  }

  logout = async () => {
    await signOut(this.auth);
  };

  getUsersCollection() {
    return collection(this.db, "users");
  }
  getEventsCollection() {
    return collection(this.db, "events");
  }

  async addEvent(eventData: Record<string, any>): Promise<void> {
    console.log("Firebase.addEvent.eventData: ", eventData);

    try {
      const eventRef = doc(this.db, "events", eventData.id);
      const res = await setDoc(eventRef, eventData);
      console.log("Firebase.addEvent.res: ", res);
    } catch (error) {
      console.error("Firebase.addEvent.e: ", error);
      throw error;
    }
  }
  async addUser(userData: Record<string, any>): Promise<void> {
    //TODO add name when signin with email and password
    try {
      const plainUserData = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        userType: UserType.user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const userRef = doc(this.db, "users", userData.uid);
      await setDoc(userRef, plainUserData);
      console.log("Firebase.addUser.userData: ", userData);
    } catch (error) {
      console.error("Firebase.addUser.e: ", error);
      throw error;
    }
  }
  async getUserByUid(userId: string) {
    const docRef = doc(this.db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }
  async getAllEvents(): Promise<any[]> {
    try {
      const eventsCollection = this.getEventsCollection();
      const snapshot = await getDocs(eventsCollection);
      const eventsList = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      return eventsList;
    } catch (error) {
      console.error("Firebase.getAllEvents.e: ", error);
      throw error;
    }
  }
  async getEventsAfter(date: Date) {
    const eventsQuery = query(
      this.getEventsCollection(),
      orderBy("startDate", "asc"),
      where("startDate", ">", date)
    );
    const events = await getDocs(eventsQuery);
    return events.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  }
  async getEventsByUser(userId: string) {
    const eventsQuery = query(
      this.getEventsCollection(),
      where("userId", "==", userId)
    );
    const events = await getDocs(eventsQuery);
    return events.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  }
  //TODO password reset
}
