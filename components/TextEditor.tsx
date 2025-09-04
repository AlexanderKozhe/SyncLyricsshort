import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import UploadIcon from './icons/UploadIcon';
import PasteIcon from './icons/PasteIcon';
import { SyncedLine } from '../types';
import { parseTTML } from '../services/parser';

interface TextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  onLinesUpload: (lines: SyncedLine[]) => void;
  onToggleHelper: () => void;
}

const TextEditor = forwardRef<{ scrollToLine: (index: number) => void }, TextEditorProps>(({ text, onTextChange, onLinesUpload, onToggleHelper }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);

  const hasText = text.length > 0;

  useImperativeHandle(ref, () => ({
    scrollToLine: (lineIndex: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const lines = textarea.value.split('\n');
      const position = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
      
      textarea.focus();
      textarea.setSelectionRange(position, position);

      const lineHeight = textarea.scrollHeight / lines.length;
      textarea.scrollTop = (lineIndex * lineHeight) - (textarea.clientHeight / 2);
    }
  }));

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileContent = e.target?.result as string;
        if (file.name.toLowerCase().endsWith('.ttml') || file.type === 'application/ttml+xml') {
            try {
                const newLines = parseTTML(fileContent);
                onLinesUpload(newLines);
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Произошла ошибка при разборе файла.');
            }
        } else { // assume .txt
            onTextChange(fileContent);
        }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (event.target) {
      event.target.value = ''; // Reset for re-uploading same file
    }
  };
  
  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
        if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.type === 'application/ttml+xml' || file.name.toLowerCase().endsWith('.ttml')) {
            handleFileUpload(file);
        }
    }
  }, [onTextChange, onLinesUpload]);

  const handleReset = () => {
    onTextChange('');
    setShowPasteArea(false);
  };

  if (hasText || showPasteArea) {
    return (
      <div className="h-full flex flex-col bg-slate-800 rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">Шаг 2: Вставьте и отредактируйте текст</h2>
            <p className="text-slate-400 mt-1">Каждая строка будет отдельным элементом для синхронизации.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleReset}
                className="whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="Изменить источник текста"
            >
                Изменить источник
            </button>
            <button
              onClick={onToggleHelper}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium transition-all duration-300 ease-in-out bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              title="Помощник по форматированию"
            >
              <SparklesIcon />
              <span>Помощник</span>
            </button>
          </div>
        </div>
        <div className="flex-grow p-6 pt-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Вставьте ваш текст здесь.
Каждая новая строка будет отдельным субтитром."
            className="h-full w-full p-5 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none custom-scrollbar text-base"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-800 rounded-lg p-8">
      <h2 className="text-xl font-semibold mb-2 text-slate-200">Шаг 2: Добавьте текст</h2>
      <p className="text-slate-400 mb-8 max-w-md">Вы можете загрузить текстовый файл или вставить текст вручную.</p>
      
      <label
        htmlFor="text-file-input"
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center w-full max-w-lg h-56 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon />
          <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-sky-400">Нажмите для загрузки</span> или перетащите файл</p>
          <p className="text-xs text-slate-500">.TXT или .TTML файл</p>
        </div>
      </label>
      <input 
        id="text-file-input" 
        ref={fileInputRef}
        type="file" 
        accept=".txt,text/plain,.ttml,application/ttml+xml" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      <div className="my-6 flex items-center w-full max-w-lg">
        <div className="flex-grow border-t border-slate-700"></div>
        <span className="flex-shrink mx-4 text-slate-500 text-sm">ИЛИ</span>
        <div className="flex-grow border-t border-slate-700"></div>
      </div>
      
      <button
        onClick={() => setShowPasteArea(true)}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
      >
        <PasteIcon />
        Вставить текст вручную
      </button>
    </div>
  );
});

export default TextEditor;