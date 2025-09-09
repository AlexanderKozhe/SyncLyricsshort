import React, { useState } from 'react';
// FIX: Removed v9 modular import for `signInWithEmailAndPassword` which was causing an error.
import { auth } from '../firebase';
import SpinnerIcon from './icons/SpinnerIcon';
import ZionLogo from './icons/ZionLogo';

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Неверный формат email адреса.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный email или пароль.';
    case 'auth/too-many-requests':
      return 'Слишком много попыток входа. Попробуйте позже.';
    default:
      return 'Произошла ошибка аутентификации.';
  }
};


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // FIX: Use the v8-style `signInWithEmailAndPassword` method from the auth object.
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged in AuthGate will handle the redirect
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#5B86E5] text-white p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ZionLogo />
            </div>
            <p className="text-gray-300">Вход в панель синхронизации</p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-lg p-8 rounded-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
              />
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/20 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] transition"
              />
            </div>
            
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center h-11 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF553E] hover:bg-[#ff7b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/20 focus:ring-[#FF553E] transition disabled:bg-red-400/50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="animate-spin h-5 w-5 text-white" />
                    <span className="ml-2">Вход...</span>
                  </>
                ) : (
                  <span>Войти</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;