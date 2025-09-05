import React, { useState, useEffect } from 'react';
// FIX: Updated Firebase imports and types to use the v8 namespaced API syntax.
import firebase from 'firebase/app';
import { auth } from '../firebase';
import App from '../App';
import LoginPage from './LoginPage';
import SpinnerIcon from './icons/SpinnerIcon';

const AuthGate: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use the onAuthStateChanged method from the v8 auth service instance.
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
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
