import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Role } from '../types';

import App from '../App';
import LoginPage from './LoginPage';
import NewUserSetupPage from './NewUserSetupPage';
import SpinnerIcon from './icons/SpinnerIcon';

const AuthGate: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { uid: firebaseUser.uid, ...userDoc.data() } as User;
    }
    // Если документа нет, это аномалия, т.к. админ должен был его создать.
    // Возвращаем null, чтобы система разлогинила пользователя.
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
            // Профиль не найден, разлогиниваем
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

  // 2. ИСПРАВЛЕНО: Функция теперь также устанавливает isNewUser: false
  const handleProfileSave = async (data: { firstName: string; lastName: string; photoURL?: string }) => {
    if (!userProfile) throw new Error("Пользователь не найден для сохранения");

    const updatedProfile: User = { ...userProfile, ...data, isNewUser: false };
    
    const userDocRef = doc(db, 'users', userProfile.uid);
    await setDoc(userDocRef, { 
      firstName: data.firstName, 
      lastName: data.lastName, 
      photoURL: data.photoURL || null,
      isNewUser: false // Явно указываем флаг для снятия
    }, { merge: true });

    setUserProfile(updatedProfile);
  };

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
  };

  if (authStatus === 'loading' || (authStatus === 'authed' && !userProfile)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <SpinnerIcon />
        <p className="mt-4 text-lg">Загрузка профиля...</p>
      </div>
    );
  }

  if (authStatus === 'authed' && userProfile) {
    // 1. ИСПРАВЛЕНО: Проверяем флаг isNewUser, а не имя/фамилию
    if (userProfile.isNewUser) {
      return <NewUserSetupPage user={userProfile} onSave={handleProfileSave} />;
    }
    return <App userProfile={userProfile} onLogout={handleLogout} />;
  }

  return <LoginPage />;
};

export default AuthGate;
