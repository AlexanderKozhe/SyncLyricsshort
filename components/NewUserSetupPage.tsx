import React, { useState } from 'react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { User } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import ZionLogo from './icons/ZionLogo';

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
      const credential = EmailAuthProvider.credential(currentUser.email, tempPassword);
      await reauthenticateWithCredential(currentUser, credential);

      await onSave({
        firstName,
        lastName,
        photoURL: photoURL || ''
      });

      await updatePassword(currentUser, newPassword);

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
        case 'permission-denied':
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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#5B86E5] text-white p-4 font-sans">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ZionLogo />
            </div>
            <h1 className="text-2xl font-bold">Завершение регистрации</h1>
            <p className="text-gray-300">Пожалуйста, укажите ваши данные и установите новый пароль.</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-lg p-8 rounded-lg">
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
                required
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
                required
              />
            </div>
            <div>
              <input
                type="url"
                placeholder="URL фотографии (необязательно)"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
              />
            </div>
            
            <hr className="border-white/10" />

            <div>
              <input
                type="password"
                placeholder="Временный пароль"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
                required
              />
              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center h-11 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF553E] hover:bg-[#ff7b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/20 focus:ring-[#FF553E] transition disabled:bg-red-400/50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <span>Сохранить и войти</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center text-sm text-gray-300 hover:text-white hover:bg-black/20 py-2 rounded-lg transition"
                disabled={loading}
              >
                Выйти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewUserSetupPage;
