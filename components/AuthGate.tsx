import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import App from '../App';
import LoginPage from './LoginPage';
import SpinnerIcon from './icons/SpinnerIcon';
import firebase from 'firebase/compat/app';
import NewUserSetupPage from './NewUserSetupPage';

const AuthGate: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data()?.isNewUser) {
          setIsNewUser(true);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleUserSetupComplete = () => {
    setIsNewUser(false);
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
    if (isNewUser) {
      return <NewUserSetupPage user={user} onSetupComplete={handleUserSetupComplete} />;
    }
    return <App user={{ uid: user.uid, email: user.email }} onLogout={handleLogout} />;
  }

  return <LoginPage />;
};

export default AuthGate;
