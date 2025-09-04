import React, { useCallback, useRef } from 'react';
import MusicNoteIcon from './icons/MusicNoteIcon';

interface AudioUploadProps {
  onAudioUpload: (file: File) => void;
  audioFileName: string | null;
  onNoAudio: () => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onAudioUpload, audioFileName, onNoAudio }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAudioUpload(file);
    }
    if (event.target) {
      event.target.value = ''; // Сброс для повторной загрузки того же файла
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
        onAudioUpload(file);
    }
  }, [onAudioUpload]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-800 rounded-lg p-8">
      {audioFileName ? (
        <>
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Аудиофайл загружен</h2>
          <div className="flex items-center text-left gap-4 bg-slate-900/50 border border-slate-700 rounded-lg px-6 py-4 mb-8 w-full max-w-lg">
            <MusicNoteIcon />
            <p className="text-lg text-green-400 font-medium break-all" aria-label="Имя файла">{audioFileName}</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
          >
            Изменить аудиофайл
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Шаг 1: Загрузите аудиофайл</h2>
          <p className="text-slate-400 mb-8 max-w-md">Выберите или перетащите аудиофайл (MP3, WAV, OGG), который вы хотите синхронизировать с текстом. После загрузки вы перейдете к следующему шагу.</p>
          
          <label
            htmlFor="audio-file-input"
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-sky-400">Нажмите для загрузки</span> или перетащите файл</p>
              <p className="text-xs text-slate-500">MP3, WAV, OGG, FLAC</p>
            </div>
          </label>
          <div className="my-6 flex items-center w-full max-w-lg">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm">ИЛИ</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          <button
            onClick={onNoAudio}
            className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
          >
            Продолжить без аудио
          </button>
        </>
      )}
      <input 
        id="audio-file-input" 
        ref={fileInputRef}
        type="file" 
        accept="audio/*" 
        className="hidden" 
        onChange={handleFileChange} 
      />
    </div>
  );
};

export default AudioUpload;