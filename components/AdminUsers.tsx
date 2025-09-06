import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Используем клиентский SDK
import SpinnerIcon from './icons/SpinnerIcon';
import RegisterUserModal from './RegisterUserModal';

interface User {
  uid: string;
  email: string;
  role: string;
}

// Определяем тип для данных зарегистрированного пользователя
interface RegisteredUserData {
  email: string;
  password: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  // Состояние для данных нового пользователя и заголовка модального окна
  const [registeredUserData, setRegisteredUserData] = useState<RegisteredUserData | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Используем getDocs из 'firebase/firestore' (v9+)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }) as User);
      setUsers(usersList);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserRegistered = (data: RegisteredUserData) => {
    fetchUsers();
    setRegisteredUserData(data); // Сохраняем данные пользователя
  }

  const handleOpenModal = () => {
      setRegisteredUserData(null); // Сбрасываем данные при открытии
      setIsRegisterModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <SpinnerIcon />
            <p className="ml-4 text-slate-300">Загрузка пользователей...</p>
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-400">Ошибка: {error}</div>;
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-slate-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Управление пользователями</h3>
          <button
            onClick={handleOpenModal}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors shadow-md"
          >
            + Зарегистрировать
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Роль</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">UID</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">{user.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseModal}
        onUserRegistered={handleUserRegistered}
        registeredUserData={registeredUserData} // Передаем данные в модальное окно
      />
    </>
  );
};

export default AdminUsers;
