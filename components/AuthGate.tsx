import React, { useState, useEffect } from 'react';
// FIX: Remove v9 modular imports that were causing errors. The new logic uses the auth object directly.
import { auth } from '../firebase';
import App from '../App';
import LoginPage from './LoginPage';
import SpinnerIcon from './icons/SpinnerIcon';
// FIX: Import firebase compat to get the v8-style User type.
import firebase from 'firebase/compat/app';

const AuthGate: React.FC = () => {
  // FIX: Use the v8-style User type from the firebase compat object.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use the v8-style `onAuthStateChanged` method from the auth object.
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    // FIX: Use the v8-style `signOut` method from the auth object.
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <SpinnerIcon />
        <p className="mt-4 text-lg">Загрузка...</p>
      </div>
    );
  }

  if (user) {
    return <App user={{ email: user.email }} onLogout={handleLogout} />;
  }

  return <LoginPage />;
};

export default AuthGate;