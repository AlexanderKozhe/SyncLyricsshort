
import React, { useEffect, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string | null;
  cancelText?: string;
  isConfirmDisabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirmDisabled = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => modalRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }
  
  const confirmButtonClass = "bg-[#FF553E] hover:bg-[#ff7b6b] focus:ring-[#FF553E]";

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
        className="relative w-full max-w-md m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="document"
      >
        <div className="flex items-start justify-between p-5 border-b border-white/10 rounded-t">
          <h3 className="text-xl font-semibold text-white" id="modal-title">
            {title}
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
        <div className="p-6 space-y-4 text-gray-300">
          {children}
        </div>
        <div className="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
          >
            {cancelText}
          </button>
          {confirmText && (
            <button
                onClick={onConfirm}
                type="button"
                disabled={isConfirmDisabled}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:ring-4 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
            >
                {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
