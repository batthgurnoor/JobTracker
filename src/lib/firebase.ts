import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export function getFirebaseOptions(): FirebaseOptions | null {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID
  } = import.meta.env;

  if (
    !VITE_FIREBASE_API_KEY ||
    !VITE_FIREBASE_AUTH_DOMAIN ||
    !VITE_FIREBASE_PROJECT_ID ||
    !VITE_FIREBASE_STORAGE_BUCKET ||
    !VITE_FIREBASE_MESSAGING_SENDER_ID ||
    !VITE_FIREBASE_APP_ID
  ) {
    return null;
  }

  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseOptions() !== null;
}

let persistenceReady: Promise<void> | null = null;

function ensureAuthPersistence(auth: Auth): Promise<void> {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Firebase auth persistence could not be enabled:", error);
    });
  }
  return persistenceReady;
}

function getOrCreateApp(): FirebaseApp {
  const options = getFirebaseOptions();
  if (!options) {
    throw new Error(
      "Firebase is not configured. Copy `.env.example` to `.env` and add your Firebase web app keys."
    );
  }
  if (getApps().length === 0) {
    return initializeApp(options);
  }
  return getApps()[0]!;
}

export function getAuthInstance(): Auth {
  const auth = getAuth(getOrCreateApp());
  void ensureAuthPersistence(auth);
  return auth;
}

export function getFirestoreInstance(): Firestore {
  return getFirestore(getOrCreateApp());
}
