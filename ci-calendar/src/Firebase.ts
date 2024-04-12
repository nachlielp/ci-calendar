import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  GithubAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { Database } from "firebase/database";

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
  githubProvider: GithubAuthProvider;
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
    this.githubProvider = new GithubAuthProvider();
  }
  getAuth() {
    return this.auth;
  }
  getGoogleProvider() {
    return this.googleProvider;
  }
  getGithubProvider() {
    return this.githubProvider;
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
  async loginWithGithub(): Promise<UserCredential | void> {
    try {
      const result = await signInWithPopup(
        this.getAuth(),
        this.getGithubProvider()
      );
      if (result && result.user) {
        return result;
      }
    } catch (error) {
      console.error("Firebase.loginWithGithub.e: ", error);
    }
  }

  logout = async () => {
    await signOut(this.auth);
  };

  //TODO password reset
}
