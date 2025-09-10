
import React, { useState } from 'react';
import CopyIcon from '../icons/CopyIcon';
import DownloadIcon from '../icons/DownloadIcon';
import { formatLRCTime } from '../../services/formatter';

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
                .filter((sub: any) => typeof sub.time === 'number' && sub.text !== '...')
                .sort((a: any, b: any) => a.time - b.time)
                .map((sub: { time: number, text: string }) => {
                    let text = sub.text.trim();
                    if (text.toUpperCase() === '#INSTRUMENTAL' || text.toUpperCase() === 'END') {
                        text = '';
                    }
                    return `[${formatLRCTime(sub.time)}]${text}`;
                });
            
            if (lrcLines.length === 0) {
                throw new Error("В JSON не найдено строк для конвертации.");
            }
            
            // Используем \n для реального переноса строки
            setLrcOutput(lrcLines.join('\n'));

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
        // Добавляем \r\n для совместимости с Windows
        const blob = new Blob([lrcOutput.replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' });
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
        <div className="h-full flex flex-col p-6 gap-6 bg-black/20 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-white">Musixmatch конвертер (Draft JSON → LRC)</h2>
                    <p className="text-gray-300 text-sm">Вставьте содержимое JSON-черновика для конвертации в LRC.</p>
                </div>
            </div>
            
             <div className="flex flex-col gap-2 flex-grow min-h-0">
                <label htmlFor="draft-input-2" className="text-sm font-medium text-gray-200">1. Draft JSON</label>
                <textarea 
                    id="draft-input-2"
                    value={draftInput}
                    onChange={(e) => setDraftInput(e.target.value)}
                    placeholder="Вставьте сюда содержимое JSON-черновика Musixmatch"
                    className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] resize-none custom-scrollbar text-sm font-mono"
                />
            </div>
            
            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!draftInput}
                >
                    Конвертировать в LRC
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {lrcOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-lrc" className="text-sm font-medium text-gray-200">2. Результат (LRC)</label>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors" title="Копировать">
                                <CopyIcon copied={copied} />
                            </button>
                            <button onClick={handleDownload} className="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors" title="Скачать">
                                <DownloadIcon />
                            </button>
                        </div>
                    </div>
                    <textarea
                        id="output-lrc"
                        readOnly
                        value={lrcOutput}
                        className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
};

export default DraftToLrcConverter;
