
import React, { useState } from 'react';
import CopyIcon from '../icons/CopyIcon';
import DownloadIcon from '../icons/DownloadIcon';
import { toTTML } from '../../services/formatter';
import { SyncedLine } from '../../types';
import { parseLrcText } from './utils';

const LrcToTtmlConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lrcInput, setLrcInput] = useState('');
    const [ttmlOutput, setTtmlOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const parseLrcToSyncedLines = (lrc: string): SyncedLine[] => {
        const timedLines = parseLrcText(lrc);
        if (timedLines.length === 0) return [];
        
        timedLines.sort((a, b) => a.time - b.time);

        const syncedLines: SyncedLine[] = [];
        let totalDuration = 0;

        for (let i = 0; i < timedLines.length; i++) {
            const currentLine = timedLines[i];
            
            // Пропускаем пустые строки, они используются только для определения конца
            if (!currentLine.text) {
                continue;
            }

            // Ищем следующий таймкод (даже если у него пустой текст)
            const nextLine = timedLines.find((line, index) => index > i);

            syncedLines.push({
                id: `lrc-line-${i}`,
                text: currentLine.text,
                begin: currentLine.time,
                end: nextLine ? nextLine.time : currentLine.time + 3 // запас в 3с, если это последняя строка
            });
        }
        
        if (syncedLines.length > 0) {
            totalDuration = syncedLines[syncedLines.length - 1].end ?? 0;
        }

        return syncedLines;
    };


    const handleConvert = () => {
        setError('');
        setTtmlOutput('');
        try {
            const syncedLines = parseLrcToSyncedLines(lrcInput);
            if (syncedLines.length === 0) throw new Error("Не удалось найти строки с таймкодами в LRC.");
            
            const audioDuration = syncedLines.length > 0 ? (syncedLines[syncedLines.length - 1].end ?? 0) : 0;
            const resultTtml = toTTML(syncedLines, audioDuration);
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
        <div className="h-full flex flex-col p-6 gap-6 bg-black/20 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-white">LRC → TTML Конвертер</h2>
                    <p className="text-gray-300 text-sm">Вставьте содержимое LRC-файла для конвертации в TTML.</p>
                </div>
            </div>
            
             <div className="flex flex-col gap-2 flex-grow min-h-0">
                <label htmlFor="lrc-input-2" className="text-sm font-medium text-gray-200">1. LRC-файл</label>
                <textarea 
                    id="lrc-input-2"
                    value={lrcInput}
                    onChange={(e) => setLrcInput(e.target.value)}
                    placeholder="Вставьте сюда содержимое .lrc файла"
                    className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] resize-none custom-scrollbar text-sm font-mono"
                />
            </div>
            
            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!lrcInput}
                >
                    Конвертировать в TTML
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {ttmlOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-ttml" className="text-sm font-medium text-gray-200">2. Результат (TTML)</label>
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
                        id="output-ttml"
                        readOnly
                        value={ttmlOutput}
                        className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
}

export default LrcToTtmlConverter;
