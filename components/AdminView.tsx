import React, { useState } from 'react';
import AdminUsers from './AdminUsers';
import WandIcon from './icons/WandIcon';
import CopyIcon from './icons/CopyIcon';
import DownloadIcon from './icons/DownloadIcon';
import { toTTML, formatLRCTime } from '../services/formatter';
import { SyncedLine } from '../types';

// --- Individual Converter Components ---

const MusixmatchConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lrcInput, setLrcInput] = useState('');
    const [draftInput, setDraftInput] = useState('');
    const [draftOutput, setDraftOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const parseLRC = (lrc: string): { time: number; text: string }[] => {
        const lines = lrc.split('\\n');
        const result: { time: number; text: string }[] = [];
        const regex = /\\\[(\d{2}):(\d{2})\\.(\d{2,3})\\\](.*)/;

        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const centiseconds = parseInt(match[3], 10);
                const text = match[4].trim();
                
                const totalSeconds = minutes * 60 + seconds + centiseconds / (match[3].length === 2 ? 100 : 1000);

                if (text && text.toUpperCase() !== '#INSTRUMENTAL' && text.toUpperCase() !== 'END') {
                    result.push({ time: parseFloat(totalSeconds.toFixed(3)), text });
                }
            }
        }
        return result;
    };

    const handleConvert = () => {
        setError('');
        setDraftOutput('');

        try {
            const lrcData = parseLRC(lrcInput);
            if (lrcData.length === 0) throw new Error("Неверный или пустой LRC.");
            
            const draftData = JSON.parse(draftInput);
            if (!draftData.subtitles || !Array.isArray(draftData.subtitles)) {
                throw new Error("Неверный формат Draft JSON: массив 'subtitles' не найден.");
            }

            const newDraft = JSON.parse(JSON.stringify(draftData));
            
            let lrcIndex = 0;
            let draftTextLines = 0;

            for (const subtitle of newDraft.subtitles) {
                const text = (subtitle.text || '').trim();
                if (text && text !== '...' && text.toUpperCase() !== 'END' && text.toUpperCase() !== '#INSTRUMENTAL') {
                    draftTextLines++;
                    if (lrcIndex < lrcData.length) {
                       subtitle.time = lrcData[lrcIndex].time;
                       lrcIndex++;
                    }
                }
            }
            
            if (lrcData.length !== draftTextLines) {
                 console.warn(`Количество строк LRC (${lrcData.length}) не совпадает с количеством строк в черновике (${draftTextLines}). Результат может быть неточным.`);
            }

            setDraftOutput(JSON.stringify(newDraft, null, 4));

        } catch (e) {
            setError(`Ошибка конвертации: ${e instanceof Error ? e.message : 'Неизвестная ошибка.'}`);
        }
    };

    const handleCopy = () => {
        if (!draftOutput) return;
        navigator.clipboard.writeText(draftOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!draftOutput) return;
        const blob = new Blob([draftOutput], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `draft_converted.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
         <div className="h-full flex flex-col p-6 gap-6 bg-slate-800 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-slate-200">Musixmatch конвертер (LRC → Draft JSON)</h2>
                    <p className="text-slate-400 text-sm">Вставьте содержимое LRC и JSON-черновика, чтобы объединить их.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="flex flex-col gap-2">
                    <label htmlFor="lrc-input" className="text-sm font-medium text-slate-300">1. LRC-файл</label>
                    <textarea 
                        id="lrc-input"
                        value={lrcInput}
                        onChange={(e) => setLrcInput(e.target.value)}
                        placeholder="Вставьте сюда содержимое .lrc файла"
                        className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="draft-input" className="text-sm font-medium text-slate-300">2. Draft JSON</label>
                    <textarea
                        id="draft-input"
                        value={draftInput}
                        onChange={(e) => setDraftInput(e.target.value)}
                        placeholder="Вставьте сюда содержимое JSON-черновика Musixmatch"
                        className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            </div>

            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    disabled={!lrcInput || !draftInput}
                >
                    Конвертировать
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {draftOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-json" className="text-sm font-medium text-slate-300">3. Результат</label>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Копировать">
                                <CopyIcon copied={copied} />
                            </button>
                            <button onClick={handleDownload} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Скачать">
                                <DownloadIcon />
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="output-json"
                        readOnly
                        value={draftOutput}
                        className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
};


const LrcToTtmlConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lrcInput, setLrcInput] = useState('');
    const [ttmlOutput, setTtmlOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const parseLrcToSyncedLines = (lrc: string): SyncedLine[] => {
        const lines = lrc.split('\\n');
        const timedLines: { time: number; text: string }[] = [];
        const regex = /\\\[(\d{2}):(\d{2})\\.(\d{2,3})\\\](.*)/;

        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const centiseconds = parseInt(match[3], 10);
                const text = match[4].trim();
                const totalSeconds = minutes * 60 + seconds + centiseconds / (match[3].length === 2 ? 100 : 1000);
                timedLines.push({ time: totalSeconds, text });
            }
        }
        if (timedLines.length === 0) return [];
        timedLines.sort((a, b) => a.time - b.time);

        const syncedLines: SyncedLine[] = [];
        for (let i = 0; i < timedLines.length; i++) {
            const currentLine = timedLines[i];
            if (currentLine.text) {
                const nextLine = timedLines.find((line, index) => index > i);
                syncedLines.push({
                    id: `lrc-line-${i}`,
                    text: currentLine.text,
                    begin: currentLine.time,
                    end: nextLine ? nextLine.time : timedLines[timedLines.length - 1].time + 3
                });
            }
        }
        
        const lastTimedLine = timedLines[timedLines.length - 1];
        const lastSyncedLine = syncedLines[syncedLines.length - 1];
        if (lastSyncedLine && lastTimedLine.text === '' && lastTimedLine.time > lastSyncedLine.begin!) {
            lastSyncedLine.end = lastTimedLine.time;
        }

        return syncedLines;
    };

    const handleConvert = () => {
        setError('');
        setTtmlOutput('');
        try {
            const syncedLines = parseLrcToSyncedLines(lrcInput);
            if (syncedLines.length === 0) throw new Error("Не удалось найти строки с таймкодами в LRC.");
            
            const resultTtml = toTTML(syncedLines, 0);
            setTtmlOutput(resultTtml);
        } catch (e) {
            setError(`Ошибка конвертации: ${e instanceof Error ? e.message : 'Неизвестная ошибка.'}`);
        }
    };

    const handleCopy = () => {
        if (!ttmlOutput) return;
        navigator.clipboard.writeText(ttmlOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!ttmlOutput) return;
        const blob = new Blob([ttmlOutput], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted.ttml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col p-6 gap-6 bg-slate-800 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-slate-200">LRC → TTML Конвертер</h2>
                    <p className="text-slate-400 text-sm">Вставьте содержимое LRC-файла для конвертации в TTML.</p>
                </div>
            </div>
            
             <div className="flex flex-col gap-2 flex-grow min-h-0">
                <label htmlFor="lrc-input-2" className="text-sm font-medium text-slate-300">1. LRC-файл</label>
                <textarea 
                    id="lrc-input-2"
                    value={lrcInput}
                    onChange={(e) => setLrcInput(e.target.value)}
                    placeholder="Вставьте сюда содержимое .lrc файла"
                    className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none custom-scrollbar text-sm font-mono"
                />
            </div>
            
            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    disabled={!lrcInput}
                >
                    Конвертировать в TTML
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {ttmlOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-ttml" className="text-sm font-medium text-slate-300">2. Результат (TTML)</label>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Копировать">
                                <CopyIcon copied={copied} />
                            </button>
                            <button onClick={handleDownload} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Скачать">
                                <DownloadIcon />
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="output-ttml"
                        readOnly
                        value={ttmlOutput}
                        className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
}

const DraftToLrcConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [draftInput, setDraftInput] = useState('');
    const [lrcOutput, setLrcOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleConvert = () => {
        setError('');
        setLrcOutput('');
        try {
            const draftData = JSON.parse(draftInput);
            if (!draftData.subtitles || !Array.isArray(draftData.subtitles)) {
                throw new Error("Неверный формат Draft JSON: массив 'subtitles' не найден.");
            }

            const lrcLines: string[] = draftData.subtitles
                .filter((sub: any) => sub.text && sub.text.trim() && sub.text.trim() !== '...' && typeof sub.time === 'number')
                .map((sub: { time: number, text: string }) => `[${formatLRCTime(sub.time)}]${sub.text.trim()}`);
            
            if (lrcLines.length === 0) {
                throw new Error("В JSON не найдено строк для конвертации.");
            }

            setLrcOutput(lrcLines.join('\\n'));

        } catch (e) {
            setError(`Ошибка конвертации: ${e instanceof Error ? e.message : 'Неизвестная ошибка.'}`);
        }
    };
    
    const handleCopy = () => {
        if (!lrcOutput) return;
        navigator.clipboard.writeText(lrcOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!lrcOutput) return;
        const blob = new Blob([lrcOutput], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted.lrc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col p-6 gap-6 bg-slate-800 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-slate-200">Musixmatch конвертер (Draft JSON → LRC)</h2>
                    <p className="text-slate-400 text-sm">Вставьте содержимое JSON-черновика для конвертации в LRC.</p>
                </div>
            </div>
            
             <div className="flex flex-col gap-2 flex-grow min-h-0">
                <label htmlFor="draft-input-2" className="text-sm font-medium text-slate-300">1. Draft JSON</label>
                <textarea 
                    id="draft-input-2"
                    value={draftInput}
                    onChange={(e) => setDraftInput(e.target.value)}
                    placeholder="Вставьте сюда содержимое JSON-черновика Musixmatch"
                    className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none custom-scrollbar text-sm font-mono"
                />
            </div>
            
            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    disabled={!draftInput}
                >
                    Конвертировать в LRC
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {lrcOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-lrc" className="text-sm font-medium text-slate-300">2. Результат (LRC)</label>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Копировать">
                                <CopyIcon copied={copied} />
                            </button>
                            <button onClick={handleDownload} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors" title="Скачать">
                                <DownloadIcon />
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="output-lrc"
                        readOnly
                        value={lrcOutput}
                        className="h-full w-full p-3 bg-slate-900 border border-slate-700 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
};

// --- Main Admin View Component ---

type Tool = 'musixmatch' | 'lrc2ttml' | 'draft2lrc';

const AdminView: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool | null>(null);

    const tools = [
        { 
          id: 'musixmatch',
          title: 'Musixmatch (LRC → Draft JSON)',
          description: 'Объединяет таймкоды из LRC с JSON-черновиком Musixmatch.',
        },
        { 
          id: 'draft2lrc',
          title: 'Musixmatch (Draft JSON → LRC)',
          description: 'Конвертирует JSON-черновик Musixmatch в стандартный LRC-файл.',
        },
        { 
          id: 'lrc2ttml',
          title: 'LRC → TTML Конвертер',
          description: 'Конвертирует стандартный LRC-файл в формат TTML.',
        },
    ];

    const renderContent = () => {
        switch (activeTool) {
            case 'musixmatch':
                return <MusixmatchConverter onBack={() => setActiveTool(null)} />;
            case 'lrc2ttml':
                return <LrcToTtmlConverter onBack={() => setActiveTool(null)} />;
            case 'draft2lrc':
                return <DraftToLrcConverter onBack={() => setActiveTool(null)} />;
            default:
                return (
                    <>
                        {/* Инструменты */}
                        <div className="mb-12">
                            <h3 className="text-xl font-semibold text-white mb-4">Инструменты</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.map((tool) => (
                                <div 
                                    key={tool.id} 
                                    onClick={() => setActiveTool(tool.id as Tool)}
                                    className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col hover:bg-slate-700/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-sky-500"
                                >
                                    <div className="flex items-center mb-4">
                                        <div className="bg-sky-500/20 text-sky-400 p-3 rounded-lg mr-4">
                                            <WandIcon className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white">{tool.title}</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm flex-grow">{tool.description}</p>
                                </div>
                            ))}
                            </div>
                        </div>

                        {/* Управление пользователями */}
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">Управление пользователями</h3>
                            <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg">
                            <AdminUsers />
                            </div>
                        </div>
                    </>
                );
        }
    }
    
    return (
        <div className="h-full p-4 sm:p-6 lg:p-8">
            {activeTool === null && <h2 className="text-3xl font-bold text-white mb-8">Панель администратора</h2>}
            {renderContent()}
        </div>
    );
};

export default AdminView;
