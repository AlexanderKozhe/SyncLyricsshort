import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Role } from '../types'; // Наши кастомные типы

import App from '../App';
import LoginPage from './LoginPage';
import NewUserSetupPage from './NewUserSetupPage';
import SpinnerIcon from './icons/SpinnerIcon';

const AuthGate: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Пользователь найден, возвращаем его профиль
      return { uid: firebaseUser.uid, ...userDoc.data() } as User;
    } else {
      // Пользователя нет в Firestore (возможно, только что создан администратором)
      // Создаем временный "неполный" профиль
      const newUserProfile: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        firstName: 'Имя', // Это будет триггером для NewUserSetupPage
        lastName: 'Фамилия',
        role: Role.User, // По умолчанию
        photoURL: firebaseUser.photoURL
      };
      // НЕ сохраняем его здесь, чтобы не создавать пустые документы
      return newUserProfile;
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser);
          setUserProfile(profile);
          setAuthStatus('authed');
        } catch (error) {
          console.error("Ошибка при загрузке профиля пользователя:", error);
          setAuthStatus('unauthed'); // Ошибка загрузки профиля, требуем повторного входа
        }
      } else {
        setUserProfile(null);
        setAuthStatus('unauthed');
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Функция для сохранения данных из NewUserSetupPage
  const handleProfileSave = async (data: { firstName: string; lastName: string; photoURL?: string }) => {
    if (!userProfile) throw new Error("Пользователь не найден для сохранения");

    const updatedProfile: User = { ...userProfile, ...data };
    
    // Обновляем документ в Firestore
    const userDocRef = doc(db, 'users', userProfile.uid);
    await setDoc(userDocRef, { 
      firstName: data.firstName, 
      lastName: data.lastName, 
      photoURL: data.photoURL || null
      // Роль и email не обновляем на этом этапе
    }, { merge: true });

    // Обновляем локальное состояние, чтобы вызвать перерисовку
    setUserProfile(updatedProfile);
  };

  const handleLogout = () => {
    const auth = getAuth();
    auth.signOut();
  };

  // --- Логика рендеринга ---

  if (authStatus === 'loading') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <SpinnerIcon />
        <p className="mt-4 text-lg">Аутентификация...</p>
      </div>
    );
  }

  if (authStatus === 'authed' && userProfile) {
    // Проверяем, является ли пользователь новым, по дефолтным данным
    const isNewUser = userProfile.firstName === 'Имя' && userProfile.lastName === 'Фамилия';

    if (isNewUser) {
      // Передаем правильные пропсы
      return <NewUserSetupPage user={userProfile} onSave={handleProfileSave} />;
    } else {
      // Передаем в App готовый, полный профиль пользователя
      return <App userProfile={userProfile} onLogout={handleLogout} />;
    }
  }

  return <LoginPage />;
};

export default AuthGate;
