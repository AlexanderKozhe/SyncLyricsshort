import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import Modal from './Modal';
import SpinnerIcon from './icons/SpinnerIcon';
import CopyIcon from './icons/CopyIcon';

interface RegisteredUserData {
  email: string;
  password: string;
}

interface RegisterUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserRegistered: (data: RegisteredUserData) => void;
  registeredUserData: RegisteredUserData | null; 
}

const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ isOpen, onClose, onUserRegistered, registeredUserData }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Сбрасываем состояние при каждом открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError(null);
      setLoading(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }

      const idToken = await user.getIdToken();

      const response = await fetch('/api/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Не удалось создать пользователя.');
      }
      
      // Передаем данные наверх
      onUserRegistered({ email, password: data.password });

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  const renderContent = () => {
    if (registeredUserData) {
      const credentials = `Логин: ${registeredUserData.email}
Пароль: ${registeredUserData.password}`;
      return (
        <div className="space-y-4">
            <p className="text-slate-300">Пользователь успешно создан. Сохраните его данные для входа.</p>
            <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700 space-y-2">
              <div>
                  <label className="text-xs font-medium text-slate-400">Логин</label>
                  <p className="font-mono text-slate-200">{registeredUserData.email}</p>
              </div>
              <div>
                  <label className="text-xs font-medium text-slate-400">Временный пароль</label>
                  <p className="font-mono text-slate-200">{registeredUserData.password}</p>
              </div>
            </div>
            <button 
              onClick={() => handleCopyToClipboard(credentials)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
            >
              <CopyIcon copied={copied} className="w-5 h-5" />
              {copied ? 'Скопировано!' : 'Копировать данные'}
            </button>
        </div>
      );
    }

    return (
      <form onSubmit={(e) => {e.preventDefault(); handleRegister();}}>
          <div className="space-y-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-400 -mb-2">Email будущего пользователя</label>
              <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  placeholder="user@example.com"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
      </form>
    );
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        // Действие кнопки зависит от того, есть ли данные
        onConfirm={registeredUserData ? onClose : handleRegister}
        title={registeredUserData ? 'Пользователь создан' : 'Зарегистрировать пользователя'}
        // Текст меняется в зависимости от состояния
        confirmText={registeredUserData ? 'Отлично' : (loading ? 'Регистрация...' : 'Зарегистрировать')}
        // Кнопка отмены не нужна после успеха
        showCancel={!registeredUserData}
        isConfirmDisabled={loading}
        isConfirmPrimary={!registeredUserData}
    >
      {renderContent()}
    </Modal>
  );
};

export default RegisterUserModal;
