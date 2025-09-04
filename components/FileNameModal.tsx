import React, { useState, useEffect, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';

interface FileNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string) => void;
  fileExtension: string;
}

const FileNameModal: React.FC<FileNameModalProps> = ({ isOpen, onClose, onConfirm, fileExtension }) => {
  const [filename, setFilename] = useState('subtitles');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filename.trim()) {
      onConfirm(filename.trim());
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm m-4 bg-slate-800 rounded-lg shadow-xl border border-slate-700 text-slate-200"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-700 rounded-t">
          <h3 className="text-xl font-semibold text-white" id="modal-title">
            Введите название файла
          </h3>
          <button
            type="button"
            className="text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="filename-input" className="block mb-2 text-sm font-medium text-slate-300">Название</label>
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                id="filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-l-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-2.5"
                required
              />
              <span className="inline-flex items-center px-3 text-sm text-slate-400 bg-slate-700 border border-l-0 border-slate-700 rounded-r-md">
                .{fileExtension}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end p-6 space-x-2 border-t border-slate-700 rounded-b">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 focus:ring-4 focus:outline-none focus:ring-slate-600 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-500 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileNameModal;