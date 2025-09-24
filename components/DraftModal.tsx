
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full m-4 border border-slate-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Обнаружен черновик</h2>
          {timestamp && <p className="text-sm text-slate-400 mb-4">{formatTimestamp(timestamp)}</p>}
          <p className="text-slate-300 mb-6">{message}</p>
        </div>
        <div className="flex justify-end gap-4 px-6 py-4 bg-slate-900/50 rounded-b-xl">
          <button
            onClick={onReset}
            className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Сбросить
          </button>
          <button
            onClick={onRestore}
            className="px-6 py-2 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Восстановить
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftModal;
