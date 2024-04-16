import { initializeApp, getApps } from "firebase/app";
import { get, query } from "firebase/database";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
// interface IFirebaseConfig {
//   apiKey;
//   authDomain;
//   projectId;
//   storageBucket;
//   messagingSenderId;
//   appId;
//   measurementId;
// }

export const firebaseService = {
  initFirebaseJS,
  getDocuments,
  getDocument,
  addDocument,
  updateDocument,
  removeDocument,
  subscribe,
  signinGoogle,
  logout,
};

async function initFirebaseJS() {
  try {
    if (!getApps().length) {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      const app = initializeApp(firebaseConfig);
      // const analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error("firebaseService.initFirebaseJS.error: ", error);
    throw error;
  }
}

export async function signinGoogle() {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return user;
  } catch (error) {
    console.log("firebaseService.signinGoogle.error: ", error);
    throw error;
  }
}
export async function signupEmail(email, password, name) {
  try {
    const auth = getAuth();
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res;
  } catch (error) {
    console.log("firebaseService.signinEmail.error: ", error);
    throw error;
  }
}
export async function signinEmail(email, password) {
  try {
    const auth = getAuth();
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.log("firebaseService.signinEmail.error: ", error);
    throw error;
  }
}
export async function resetEmailPassword(email) {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.log("firebaseService.resetPassword.error: ", error);
    throw error;
  }
}

export async function logout() {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (error) {
    console.log("firebaseService.logout.error: ", error);
    throw error;
  }
}

export async function onAuthChanged(cb) {
  const auth = getAuth();
  return onAuthStateChanged(auth, cb);
}
export async function getDb() {
  try {
    const db = getFirestore();
    return db;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function addDocument(collectionName, document) {
  try {
    const db = await getDb();
    const docRef = doc(db, collectionName, document.id);
    await setDoc(docRef, document);
    return docRef;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getDocument(collectionName, id) {
  try {
    const db = await getDb();
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updateDocument(collectionName, id, document) {
  try {
    const db = await getDb();
    await setDoc(doc(db, collectionName, id), document, { merge: true });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function removeDocument(collectionName, id) {
  try {
    const db = await getDb();
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// interface DocumentFilters {
//   userId?;
//   afterDate?;
//   beforeDate?;
// }

export let gLastDocForPaging = null;

export async function getDocuments(collectionName, filters) {
  const db = await getDb();
  let collectionRef = collection(db, collectionName);

  if (filters.userId) {
    collectionRef = query(collectionRef, where("id", "==", filters.userId));
  }
  if (filters.afterDate) {
    collectionRef = query(collectionRef, where("startAt" > filters.afterDate));
  }
  if (filters.beforeDate) {
    collectionRef = query(collectionRef, where("startAt" < filters.beforeDate));
  }

  const querySnapshot = await getDocs(collectionRef);
  gLastDocForPaging = querySnapshot.docs[querySnapshot.docs.length - 1];
  const docs = [];
  querySnapshot.forEach((doc) => {
    // console.log(`${doc.id} => ${JSON.stringify(doc.data())}`)
    docs.push({ id: doc.id, ...doc.data() });
  });
  return docs;
}

export async function subscribe(collectionName, cb) {
  const db = await getDb();
  const unsubscribe = onSnapshot(
    collection(db, collectionName),
    (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      cb(docs);
    }
  );
  return unsubscribe;
}