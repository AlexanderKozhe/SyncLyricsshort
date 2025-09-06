import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import SpinnerIcon from './icons/SpinnerIcon';
import RegisterUserModal from './RegisterUserModal';

interface User {
  uid: string;
  email: string;
  role: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Зарегистрировать пользователя');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = db.collection('users');
      const usersSnapshot = await usersCollection.get();
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

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      const userDocRef = db.collection('users').doc(uid);
      await userDocRef.update({ role: newRole });
      await fetchUsers(); // Refresh users after role change
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleUserRegistered = () => {
    fetchUsers();
    // Keep the modal open to show the success message, but change the title
    setModalTitle('Пользователь зарегистрирован');
  }

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
    // Reset title for the next time it opens
    setTimeout(() => setModalTitle('Зарегистрировать пользователя'), 300);
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-200">Управление пользователями</h1>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Зарегистрировать пользователя
        </button>
      </div>
      <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">UID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Роль</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">{user.uid}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                    className="bg-slate-600 border border-slate-500 rounded-md px-3 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none"
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        title={modalTitle}
        onClose={handleCloseModal}
        onUserRegistered={handleUserRegistered}
      />
    </>
  );
};

export default AdminUsers;
