//NOTICE the app no longer uses firebase, this file is left for reference

// import { initializeApp, getApps } from "firebase/app";
// import { get, query } from "firebase/database";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   getFirestore,
//   setDoc,
//   where,
//   getDocs,
//   onSnapshot,
//   runTransaction,
//   updateDoc,
// } from "firebase/firestore";
// import {
//   createUserWithEmailAndPassword,
//   getAuth,
//   signInWithEmailAndPassword,
//   signOut,
//   sendPasswordResetEmail,
//   signInWithPopup,
//   GoogleAuthProvider,
//   onAuthStateChanged,

// } from "firebase/auth";

// export const firebaseService = {
//   initFirebaseJS,
//   getDocuments,
//   getDocument,
//   addDocument,
//   updateDocument,
//   removeDocument,
//   subscribeToCollection,
//   signinGoogle,
//   logout,
//   getTeachersAndAdminsList,
//   removeMultipleDocuments,
//   addDocumentIfNotExists,
// };

// async function initFirebaseJS() {
//   try {
//     if (!getApps().length) {
//       const firebaseConfig = {
//         apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//         authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//         projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//         storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//         messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//         appId: import.meta.env.VITE_FIREBASE_APP_ID,
//         measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
//       };

//       const app = initializeApp(firebaseConfig);
//       // const analytics = getAnalytics(app);
//     }
//   } catch (error) {
//     console.error("firebaseService.initFirebaseJS.error: ", error);
//     throw error;
//   }
// }

// export async function signinGoogle() {
//   try {
//     const auth = getAuth();
//     const provider = new GoogleAuthProvider();
//     const result = await signInWithPopup(auth, provider);
//     const user = result.user;
//     return user;
//   } catch (error) {
//     console.error("firebaseService.signinGoogle.error: ", error);
//     throw error;
//   }
// }
// export async function signupEmail(email, password, name) {
//   try {
//     const auth = getAuth();
//     const res = await createUserWithEmailAndPassword(auth, email, password);
//     return res;
//   } catch (error) {
//     console.error("firebaseService.signinEmail.error: ", error);
//     throw error;
//   }
// }
// export async function signinEmail(email, password) {
//   try {
//     const auth = getAuth();
//     const user = await signInWithEmailAndPassword(auth, email, password);
//     return user;
//   } catch (error) {
//     console.error("firebaseService.signinEmail.error: ", error);
//     throw error;
//   }
// }
// export async function resetEmailPassword(email) {
//   try {
//     const auth = getAuth();
//     await sendPasswordResetEmail(auth, email);
//   } catch (error) {
//     console.error("firebaseService.resetPassword.error: ", error);
//     throw error;
//   }
// }

// export async function logout() {
//   try {
//     const auth = getAuth();
//     await signOut(auth);
//   } catch (error) {
//     console.error("firebaseService.logout.error: ", error);
//     throw error;
//   }
// }

// export async function onAuthChanged(cb) {
//   const auth = getAuth();
//   return onAuthStateChanged(auth, cb);
// }
// export async function getDb() {
//   try {
//     const db = getFirestore();
//     return db;
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }

// export async function addDocument(collectionName, document) {
//   try {
//     const db = await getDb();
//     const docRef = doc(db, collectionName, document.id);
//     await setDoc(docRef, document);
//     return docRef;
//   } catch (error) {
//     console.error("firebaseService.addDocument.error: ", error);
//     throw error;
//   }
// }

// export async function addDocumentIfNotExists(collectionName, id, document) {
//   try {
//     const db = await getDb();
//     const docRef = doc(db, collectionName, document.id);

//     await runTransaction(db, async (transaction) => {
//       const docSnapshot = await transaction.get(docRef);
//       if (!docSnapshot.exists()) {
//         transaction.set(docRef, document);
//       }
//     });
//     return docRef;
//   } catch (error) {
//     console.error("firebaseService.addDocument.error: ", error);
//     throw error;
//   }
// }

// export async function addOrActivateTeacher(teacher) {
//   try {
//     const db = await getDb();
//     const docRef = doc(db, "teachers", teacher.id);
//     const docSnap = await getDoc(docRef);
//     if (!docSnap.exists()) {
//       await setDoc(docRef, { allowTagging: true });
//     } else {
//       await updateDoc(docRef, { allowTagging: true });
//     }
//   } catch (error) {
//     console.error("firebaseService.addOrActivateTeacher.error: ", error);
//     throw error;
//   }
// }

// export async function getDocument(collectionName, id) {
//   try {
//     const db = await getDb();
//     const docRef = doc(db, collectionName, id);
//     const docSnap = await getDoc(docRef);
//     if (!docSnap.exists()) {
//       return null;
//     }
//     return docSnap.data();
//   } catch (error) {
//     console.error("firebaseService.getDocument.error: ", error);
//     throw error;
//   }
// }

// export async function updateDocument(collectionName, id, document) {
//   try {
//     const db = await getDb();
//     await setDoc(doc(db, collectionName, id), document, {
//       merge: true,
//     });
//   } catch (error) {
//     console.error("firebaseService.updateDocument.error: ", error);
//     throw error;
//   }
// }

// export async function removeDocument(collectionName, id) {
//   try {
//     const db = await getDb();
//     await deleteDoc(doc(db, collectionName, id));
//   } catch (error) {
//     console.error("firebaseService.removeDocument.error: ", error);
//     throw error;
//   }
// }

// export async function removeMultipleDocuments(collectionName, ids) {
//   try {
//     const db = await getDb();
//     ids.forEach(async id => {
//       await deleteDoc(doc(db, collectionName, id));
//     });
//   } catch (error) {
//     console.error("firebaseService.removeMultipleDocuments.error: ", error);
//     throw error;
//   }
// }

// export let gLastDocForPaging = null;

// export async function getDocuments(collectionName, filters) {
//   try {
//     const db = await getDb();
//     let collectionRef = collection(db, collectionName);

//     if (filters.userId) {
//       collectionRef = query(collectionRef, where("id", "==", filters.userId));
//     }
//     if (filters.afterDate) {
//       collectionRef = query(collectionRef, where("startAt" > filters.afterDate));
//     }
//     if (filters.beforeDate) {
//       collectionRef = query(collectionRef, where("startAt" < filters.beforeDate));
//     }

//     const querySnapshot = await getDocs(collectionRef);
//     gLastDocForPaging = querySnapshot.docs[querySnapshot.docs.length - 1];
//     const docs = [];
//     querySnapshot.forEach((doc) => {
//       // console.log(`${doc.id} => ${JSON.stringify(doc.data())}`)
//       docs.push({ id: doc.id, ...doc.data() });
//     });
//     return docs;
//   } catch (error) {
//     console.error("firebaseService.getDocuments.error: ", error);
//     throw error;
//   }
// }

// export async function subscribeToCollection(collectionName, cb) {
//   try {
//     const db = await getDb();
//     const unsubscribe = onSnapshot(
//       collection(db, collectionName),
//       (querySnapshot) => {
//         const docs = [];
//         querySnapshot.forEach((doc) => {
//           docs.push({ id: doc.id, ...doc.data() });
//         });
//         cb(docs);
//       }
//     );
//     return unsubscribe;
//   } catch (error) {
//     console.error("firebaseService.subscribeToCollection.error: ", error);
//     throw error;
//   }
// }

// export async function subscribeToDoc(docPath, cb) {
//   try {
//     const db = await getDb();
//     const docRef = doc(db, docPath);
//     const unsubscribe = onSnapshot(
//       docRef,
//       (docSnapshot) => {
//         if (docSnapshot.exists()) {
//           cb({ id: docSnapshot.id, ...docSnapshot.data() });
//         } else {
//           console.log("No such document!");
//         }
//       },
//       (error) => {
//         console.error("Subscribe to document error: ", error);
//       }
//     );
//     return unsubscribe;
//   } catch (error) {
//     console.error("firebaseService.subscribeToDoc.error: ", error);
//     throw error;
//   }
// }

// export async function getTeachersAndAdminsList() {
//   try {
//     const db = await getDb();
//     const teachersRef = query(collection(db, "teachers"), where("allowTagging", "==", true));
//     const querySnapshot = await getDocs(teachersRef);
//     const result = [];
//     querySnapshot.forEach(doc => {
//       const data = doc.data();
//       result.push({ label: data.fullName, value: doc.id });
//     });
//     return result;
//   } catch (error) {
//     console.error("firebaseService.getTeachersAndAdmins.error: ", error);
//     throw error;
//   }
// }
