import React, { useState, useEffect } from 'react';
import { SyncedLine } from '../types';
import { toTTML, toLRC, toTXT } from '../services/formatter';
import CopyIcon from './icons/CopyIcon';
import DownloadIcon from './icons/DownloadIcon';
import FileNameModal from './FileNameModal';
import LockIcon from './icons/LockIcon';

interface ResultViewProps {
  lines: SyncedLine[];
  audioDuration: number;
  audioFileName: string | null;
  noAudioMode: boolean;
}

const ResultCard: React.FC<{ title: string; data: string; fileExtension: string; audioFileName: string | null; isLocked?: boolean; }> = ({ title, data, fileExtension, audioFileName, isLocked }) => {
  const [copied, setCopied] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const handleCopy = () => {
    if (isLocked) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (isLocked) return;
    if (audioFileName) {
      const baseFileName = audioFileName.replace(/\.[^/.]+$/, "");
      downloadFile(data, `${baseFileName}.${fileExtension}`);
    } else {
      setIsNameModalOpen(true);
    }
  };
  
  const handleConfirmName = (name: string) => {
    downloadFile(data, `${name}.${fileExtension}`);
    setIsNameModalOpen(false);
  }

  return (
    <>
      <div className="bg-slate-800 rounded-lg flex flex-col h-full shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-sky-400">{title}</h3>
          <div className="flex gap-2">
              <button onClick={handleCopy} disabled={isLocked} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Копировать">
                  <CopyIcon copied={copied} />
              </button>
              <button onClick={handleDownload} disabled={isLocked} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Скачать">
                  <DownloadIcon />
              </button>
          </div>
        </div>
        {isLocked ? (
          <div className="flex-grow flex items-center justify-center flex-col text-center p-4 text-slate-500">
            <LockIcon />
            <span className="mt-2 text-sm font-medium">Не синхронизировано</span>
          </div>
        ) : (
          <textarea
            readOnly
            value={data}
            className="flex-grow p-4 text-sm font-mono bg-slate-900/70 rounded-b-lg resize-none border-none focus:ring-0 custom-scrollbar text-slate-300 whitespace-pre"
          />
        )}
      </div>
      {!isLocked && (
        <FileNameModal
          isOpen={isNameModalOpen}
          onClose={() => setIsNameModalOpen(false)}
          onConfirm={handleConfirmName}
          fileExtension={fileExtension}
        />
      )}
    </>
  );
};

const ResultView: React.FC<ResultViewProps> = ({ lines, audioDuration, audioFileName, noAudioMode }) => {
  const [ttml, setTtml] = useState('');
  const [lrc, setLrc] = useState('');
  const [txt, setTxt] = useState('');

  useEffect(() => {
    setTtml(toTTML(lines, audioDuration));
    setLrc(toLRC(lines));
    setTxt(toTXT(lines));
  }, [lines, audioDuration]);

  return (
    <div className="h-full flex flex-col">
      <div className="pb-4">
        <h2 className="text-xl font-semibold mb-1 text-slate-200">Шаг 4: Результаты</h2>
        <p className="text-slate-400">Ваши синхронизированные файлы готовы. Вы можете скопировать содержимое или скачать файлы.</p>
      </div>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        <ResultCard title="TTML" data={ttml} fileExtension="ttml" audioFileName={audioFileName} isLocked={noAudioMode} />
        <ResultCard title="LRC" data={lrc} fileExtension="lrc" audioFileName={audioFileName} isLocked={noAudioMode} />
        <ResultCard title="TXT" data={txt} fileExtension="txt" audioFileName={audioFileName} />
      </div>
    </div>
  );
};

export default ResultView;