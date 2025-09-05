
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import App from '../App';
import LoginPage from './LoginPage';
import SpinnerIcon from './icons/SpinnerIcon';

const AuthGate: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
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
