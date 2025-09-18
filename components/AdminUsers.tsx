import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import SpinnerIcon from './icons/SpinnerIcon';
import RegisterUserModal from './RegisterUserModal';

interface User {
  uid: string;
  email: string;
  role: string;
}

interface RegisteredUserData {
  email: string;
  password: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<RegisteredUserData | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
    setRegisteredUserData(data); 
  }

  const handleOpenModal = () => {
      setRegisteredUserData(null); 
      setIsRegisterModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsRegisterModalOpen(false);
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <SpinnerIcon />
            <p className="ml-4 text-gray-200">Загрузка пользователей...</p>
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-400">Ошибка: {error}</div>;
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-black/20 rounded-lg shadow-lg">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={handleOpenModal}
            className="bg-[#FF553E] hover:bg-[#ff7b6b] text-white font-bold py-2 px-4 rounded-md transition-colors shadow-md"
          >
            + Зарегистрировать
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/40">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Роль</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">UID</th>
                </tr>
              </thead>
              <tbody className="bg-black/20 divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-black/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 capitalize">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">{user.uid}</td>
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
        registeredUserData={registeredUserData}
      />
    </>
  );
};

export default AdminUsers;
