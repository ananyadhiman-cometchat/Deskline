import { initializeApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const app = isConfigured ? initializeApp(firebaseConfig) : null;

export const messaging: Messaging | null =
  isConfigured && typeof window !== "undefined" && app
    ? getMessaging(app)
    : null;
