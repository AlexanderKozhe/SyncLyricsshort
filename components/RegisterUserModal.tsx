import React, { useState } from 'react';
import { auth } from '../firebase';
import Modal from './Modal';
import SpinnerIcon from './icons/SpinnerIcon';

interface RegisterUserModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onUserRegistered: () => void;
}

const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ isOpen, title, onClose, onUserRegistered }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<{ email: string; password: string } | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Вы не авторизованы.');
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
        throw new Error(data.message || 'Не удалось создать пользователя');
      }

      setRegisteredUser({ email, password: data.password });
      onUserRegistered();

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
      setEmail('');
      setLoading(false);
      setError(null);
      setRegisteredUser(null);
      onClose();
  }

  const renderContent = () => {
    if (registeredUser) {
      return (
        <div>
            <p className="text-slate-300 mb-2">Пожалуйста, сохраните эти данные для входа в систему.</p>
            <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
              <p><span className="font-semibold">Логин:</span> {registeredUser.email}</p>
              <p><span className="font-semibold">Пароль:</span> <span className="font-mono">{registeredUser.password}</span></p>
            </div>
        </div>
      );
    } else {
      return (
        <form onSubmit={(e) => {e.preventDefault(); handleRegister();}}>
            <div className="space-y-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-400 -mb-2">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
        </form>
      );
    }
  }
  
  const renderConfirmText = () => {
      if (registeredUser) return null;
      if (loading) return 'Регистрация...';
      return 'Зарегистрировать';
  }
  
  const renderCancelText = () => {
      return registeredUser ? 'Закрыть' : 'Отмена';
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        onConfirm={handleRegister}
        title={title}
        confirmText={renderConfirmText()}
        cancelText={renderCancelText()}
        isConfirmDisabled={loading || registeredUser !== null}
        isConfirmPrimary={!registeredUser}
    >
      {renderContent()}
    </Modal>
  );
};

export default RegisterUserModal;
