
import React from 'react';

interface DraftModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onReset: () => void;
  message: React.ReactNode;
  timestamp: number | null;
}

const DraftModal: React.FC<DraftModalProps> = ({ isOpen, onRestore, onReset, message, timestamp }) => {
  if (!isOpen) return null;

  const formatTimestamp = (ts: number | null) => {
    if (!ts) return null;
    const date = new Date(ts);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const month = monthNames[date.getMonth()];
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `от ${day} ${month}, ${time}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-md m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Обнаружен черновик</h2>
          {timestamp && <p className="text-sm text-gray-400 mb-4">{formatTimestamp(timestamp)}</p>}
          <p className="text-gray-300 mb-6">{message}</p>
        </div>
        <div className="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
          <button
            onClick={onReset}
            type="button"
            className="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
          >
            Сбросить
          </button>
          <button
            onClick={onRestore}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#FF553E] rounded-lg hover:bg-[#ff7b6b] transition-colors focus:ring-4 focus:outline-none focus:ring-[#FF553E]"
          >
            Восстановить
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftModal;
