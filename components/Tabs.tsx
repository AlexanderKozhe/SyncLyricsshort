
import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isTabDisabled: (tab: Tab) => boolean;
  isAdmin: boolean;
}

const tabConfig: { id: Tab; label: string }[] = [
  { id: Tab.Audio, label: '1. Аудио' },
  { id: Tab.Text, label: '2. Текст' },
  { id: Tab.Sync, label: '3. Синхронизация' },
  { id: Tab.Result, label: '4. Результат' },
  { id: Tab.Player, label: '5. Плеер' },
  { id: Tab.Admin, label: 'Админ' },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, isTabDisabled, isAdmin }) => {
  const visibleTabs = tabConfig.filter(tab => {
    if (tab.id === Tab.Admin) {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="border-b border-white/10 px-6 md:px-8 py-2">
      <nav className="p-1.5 inline-flex items-center gap-2 bg-black/20 rounded-xl" aria-label="Tabs">
        {visibleTabs.map((tab) => {
          const isDisabled = isTabDisabled(tab.id);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`
                whitespace-nowrap rounded-lg py-2.5 px-4 text-sm font-medium transition-[color,background-color,opacity] duration-200 ease-in-out 
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF553E] focus-visible:ring-offset-2 focus-visible:ring-offset-black/20
                ${isActive
                  ? 'bg-[#FF553E] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-black/20'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  );
};

export default Tabs;
