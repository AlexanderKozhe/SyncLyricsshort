import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Role } from '../types';

import App from '../App';
import LoginPage from './LoginPage';
import NewUserSetupPage from './NewUserSetupPage';
import SpinnerIcon from './icons/SpinnerIcon';
import ZionLogo from './icons/ZionLogo';

const AuthGate: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { uid: firebaseUser.uid, ...userDoc.data() } as User;
    }
    console.error("AuthGate: Документ пользователя не найден в Firestore, хотя аутентификация пройдена.");
    return null;
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser);
          if (profile) {
            setUserProfile(profile);
            setAuthStatus('authed');
          } else {
            auth.signOut(); 
          }
        } catch (error) {
          console.error("Ошибка при загрузке профиля пользователя:", error);
          auth.signOut();
        }
      } else {
        setUserProfile(null);
        setAuthStatus('unauthed');
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const handleProfileSave = async (data: { firstName: string; lastName: string; photoURL?: string }) => {
    if (!userProfile) throw new Error("Пользователь не найден для сохранения");

    const updatedProfile: User = { ...userProfile, ...data, isNewUser: false };
    
    const userDocRef = doc(db, 'users', userProfile.uid);
    await setDoc(userDocRef, { 
      firstName: data.firstName, 
      lastName: data.lastName, 
      photoURL: data.photoURL || null,
      isNewUser: false
    }, { merge: true });

    setUserProfile(updatedProfile);
  };

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
  };

  if (authStatus === 'loading' || (authStatus === 'authed' && !userProfile)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#5B86E5] text-white font-sans">
        <div className="flex flex-col items-center">
          <ZionLogo />
          <SpinnerIcon className="animate-spin h-8 w-8 text-white mt-8" />
          <p className="mt-4 text-lg">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'authed' && userProfile) {
    if (userProfile.isNewUser) {
      return <NewUserSetupPage user={userProfile} onSave={handleProfileSave} />;
    }
    return <App userProfile={userProfile} onLogout={handleLogout} />;
  }

  return <LoginPage />;
};

export default AuthGate;
