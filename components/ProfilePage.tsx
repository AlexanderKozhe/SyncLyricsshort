
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import PencilIcon from './icons/PencilIcon';

interface ProfilePageProps {
  user: User;
  onUpdate: (updatedProfile: Partial<User>) => void;
}

const getRoleDisplayName = (role: Role) => {
  switch (role) {
    case Role.Admin:
      return 'Администратор';
    case Role.Curator:
      return 'Куратор';
    case Role.User:
    default:
      return 'Пользователь';
  }
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setIsEditing(false);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="md:flex">
        <div className="w-full p-8">
          <div className="flex justify-center md:justify-start">
            <img className="w-32 h-32 rounded-full ring-4 ring-sky-500" src={formData.photoURL || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`} alt="User avatar" />
          </div>

          <div className="text-center md:text-left mt-4">
            {isEditing ? (
              <div className="space-y-4">
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Имя" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="Фамилия" />
                <input type="text" name="photoURL" value={formData.photoURL || ''} onChange={handleInputChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" placeholder="URL аватара" />
                <div className="flex justify-end gap-2">
                  <button onClick={handleSave} className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-500">Сохранить</button>
                  <button onClick={handleCancel} className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600">Отмена</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center md:justify-start">
                  <p className="text-2xl font-bold text-white">{user.firstName} {user.lastName}</p>
                  <button onClick={() => setIsEditing(true)} className="ml-4 text-slate-400 hover:text-white">
                    <PencilIcon />
                  </button>
                </div>
                <p className="text-slate-400">{getRoleDisplayName(user.role)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
