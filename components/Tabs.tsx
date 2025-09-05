import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isTabDisabled: (tab: Tab) => boolean;
}

const tabConfig: { id: Tab; label: string }[] = [
  { id: Tab.Audio, label: '1. Аудио' },
  { id: Tab.Text, label: '2. Текст' },
  { id: Tab.Sync, label: '3. Синхронизация' },
  { id: Tab.Result, label: '4. Результат' },
  { id: Tab.Player, label: '5. Плеер' },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, isTabDisabled }) => {
  return (
    <div className="border-b border-slate-700/50 px-6 md:px-8 py-2">
      <nav className="p-1.5 inline-flex items-center gap-2 bg-slate-800 rounded-xl" aria-label="Tabs">
        {tabConfig.map((tab) => {
          const isDisabled = isTabDisabled(tab.id);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`
                whitespace-nowrap rounded-lg py-2.5 px-4 text-sm font-medium transition-all duration-300 ease-in-out 
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                ${isActive
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
