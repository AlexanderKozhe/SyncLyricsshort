import React, { useState } from 'react';
import { auth, db } from '../firebase';
import SpinnerIcon from './icons/SpinnerIcon';
import firebase from 'firebase/compat/app';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface NewUserSetupPageProps {
  user: firebase.User;
  onSetupComplete: () => void;
}

const NewUserSetupPage: React.FC<NewUserSetupPageProps> = ({ user, onSetupComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      setError("Не удалось выйти из системы.");
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      if (!user.email) {
        throw new Error("Email пользователя не найден.");
      }
      
      const credential = EmailAuthProvider.credential(user.email, tempPassword);
      await reauthenticateWithCredential(user, credential);

      await user.updateProfile({ displayName: `${firstName} ${lastName}`, photoURL });
      await user.updatePassword(newPassword);
      await db.collection('users').doc(user.uid).update({
        firstName,
        lastName,
        photoURL,
        isNewUser: false,
      });

      onSetupComplete();

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('Неверный временный пароль.');
      } else {
        setError(err.message || 'Произошла неизвестная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-200">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Привет, новый пользователь!</h1>
        <p className="text-slate-400 mb-6 text-center">Пожалуйста, завершите регистрацию, указав свои данные.</p>
        <form onSubmit={handleSetup}>
          {/* ...поля формы остались без изменений... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <input
              type="text"
              placeholder="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="url"
              placeholder="URL фотографии (необязательно)"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Временный пароль"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading && <SpinnerIcon className="mr-2" />}
              Завершить регистрацию
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 font-bold py-2 px-4 rounded-md transition-colors"
              disabled={loading}
            >
              Выйти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserSetupPage;
