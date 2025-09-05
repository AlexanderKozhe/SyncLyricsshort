// FIX: Updated Firebase imports to use the v8 namespaced API syntax.
import firebase from "firebase/app";
import "firebase/auth";

// IMPORTANT: Your web app's Firebase configuration
// These should be set as environment variables in your Vercel project.
// For example, in Vercel, go to your project settings -> Environment Variables
// Add a new variable with the name `VITE_FIREBASE_API_KEY` and your value.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
// FIX: Updated Firebase initialization to use the v8 namespaced API syntax.
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
