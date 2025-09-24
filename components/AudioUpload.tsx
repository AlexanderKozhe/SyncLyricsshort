
import React, { useCallback, useRef } from 'react';

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
      event.target.value = '';
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
    <div className="h-full flex flex-col items-center justify-center text-center bg-black/20 rounded-lg p-8">
      {audioFileName ? (
        <>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Загрузите файл: <span className="text-[#FF553E] font-medium break-all">{audioFileName}</span>
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]"
          >
            Загрузить
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4 text-white">Шаг 1: Загрузите аудиофайл</h2>
          <p className="text-gray-300 mb-8 max-w-md">Выберите или перетащите аудиофайл (MP3, WAV, OGG), который вы хотите синхронизировать с текстом. После загрузки вы перейдете к следующему шагу.</p>
          
          <label
            htmlFor="audio-file-input"
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-black/10 hover:bg-black/20 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-gray-300"><span className="font-semibold text-[#FF553E]">Нажмите для загрузки</span> или перетащите файл</p>
              <p className="text-xs text-gray-400">MP3, WAV, OGG, FLAC</p>
            </div>
          </label>
          <div className="my-6 flex items-center w-full max-w-lg">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-300 text-sm">ИЛИ</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          <button
            onClick={onNoAudio}
            className="px-6 py-3 bg-black/20 text-white font-semibold rounded-lg hover:bg-black/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]"
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
