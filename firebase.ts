// FIX: Switch to Firebase v9 compat imports to resolve module export errors.
// This is likely needed if the project uses an older version of the Firebase SDK.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// FIX: Add global type declarations for import.meta.env to address TypeScript errors.
// This is necessary because the project's global type definitions for Vite
// environment variables are likely missing.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FIREBASE_API_KEY: string;
      readonly VITE_FIREBASE_AUTH_DOMAIN: string;
      readonly VITE_FIREBASE_PROJECT_ID: string;
      readonly VITE_FIREBASE_STORAGE_BUCKET: string;
      readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      readonly VITE_FIREBASE_APP_ID: string;
    }
  }
}

// IMPORTANT: Your web app's Firebase configuration
// These should be set as environment variables in your Vercel project.
// For example, in Vercel, go to your project settings -> Environment Variables
// Add a new variable with the name `VITE_FIREBASE_API_KEY` and your value.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
// FIX: Use v8-style initialization with the compat library.
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();