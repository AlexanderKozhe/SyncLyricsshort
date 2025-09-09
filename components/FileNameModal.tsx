
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-sm m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between p-5 border-b border-white/10 rounded-t">
          <h3 className="text-xl font-semibold text-white" id="modal-title">
            Введите название файла
          </h3>
          <button
            type="button"
            className="text-gray-300 bg-transparent hover:bg-white/10 hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="filename-input" className="block mb-2 text-sm font-medium text-gray-200">Название</label>
            <div className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                id="filename-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="bg-black/20 border border-white/10 text-white text-sm rounded-l-lg focus:ring-[#FF553E] focus:border-[#FF553E] block w-full p-2.5"
                required
              />
              <span className="inline-flex items-center px-3 text-sm text-gray-300 bg-black/30 border border-l-0 border-white/10 rounded-r-md">
                .{fileExtension}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#FF553E] rounded-lg hover:bg-[#ff7b6b] focus:ring-4 focus:outline-none focus:ring-orange-500 transition-colors"
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
