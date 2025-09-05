import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT: Your web app's Firebase configuration
// These should be set as environment variables in your Vercel project.
// For example, in Vercel, go to your project settings -> Environment Variables
// Add a new variable with the name `FIREBASE_API_KEY` and your value.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
