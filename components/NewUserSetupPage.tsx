import React, { useState } from 'react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { User } from '../types'; // Используем наш типизированный User
import SpinnerIcon from './icons/SpinnerIcon';

// 1. ИСПРАВЛЕНЫ ПРОПСЫ: теперь они соответствуют App.tsx
interface NewUserSetupPageProps {
  user: User;
  onSave: (data: { firstName: string; lastName: string; photoURL?: string }) => Promise<void>;
}

const NewUserSetupPage: React.FC<NewUserSetupPageProps> = ({ user, onSave }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

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
    if (!newPassword || newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    setError(null);

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setError("Не удалось определить текущего пользователя. Пожалуйста, войдите снова.");
      setLoading(false);
      return;
    }

    try {
      // Шаг 1: Повторная аутентификация пользователя
      const credential = EmailAuthProvider.credential(currentUser.email, tempPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. ПРАВИЛЬНЫЙ ПОРЯДОК: СНАЧАЛА СОХРАНЯЕМ ДАННЫЕ В FIRESTORE
      // Вызываем onSave, переданный из App.tsx
      await onSave({ 
        firstName, 
        lastName, 
        photoURL: photoURL || ''
      });

      // 3. ПОСЛЕ УСПЕШНОГО СОХРАНЕНИЯ: МЕНЯЕМ ПАРОЛЬ
      // Это аннулирует старый токен, но данные уже в безопасности.
      await updatePassword(currentUser, newPassword);

      // Перезагрузка страницы не нужна, т.к. App.tsx сам обновит состояние
      // onSave уже обновил userProfile в App.tsx

    } catch (err: any) {
      console.error("Ошибка при настройке профиля:", err);
      let errorMessage = 'Произошла неизвестная ошибка.';
      switch (err.code) {
        case 'auth/wrong-password':
          errorMessage = 'Неверный временный пароль. Попробуйте еще раз.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Слишком много попыток. Пожалуйста, попробуйте позже.';
          break;
        case 'auth/invalid-credential':
           errorMessage = 'Данные для входа неверны. Проверьте временный пароль.';
           break;
        case 'permission-denied': // Firestore permission error
            errorMessage = 'Ошибка прав доступа при сохранении данных. Проверьте правила безопасности Firestore.';
            break;
        default:
            errorMessage = err.message || errorMessage;
            break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-200">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Завершение регистрации</h1>
        <p className="text-slate-400 mb-6 text-center">Пожалуйста, укажите ваши данные и установите новый пароль.</p>
        <form onSubmit={handleSetup}>
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
          <hr className="border-slate-600 my-6" />
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
              placeholder="Новый пароль (минимум 6 символов)"
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
          {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-900/50 p-3 rounded-md">{error}</p>}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-sky-800 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading && <SpinnerIcon className="mr-2" />}
              Сохранить и войти
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
