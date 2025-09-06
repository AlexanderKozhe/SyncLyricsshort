
import React, { useState, useRef, useEffect } from 'react';
import { User, Role } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

interface ProfileDropdownProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout, onProfileClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} alt="Avatar" className="w-10 h-10 rounded-full" />
        <div className="text-left hidden sm:block">
          <p className="font-semibold text-white text-sm">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-slate-400">{getRoleDisplayName(user.role)}</p>
        </div>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 border-b border-slate-700">
            <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onProfileClick();
              setIsOpen(false);
            }}
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Профиль
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Выйти
          </a>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
