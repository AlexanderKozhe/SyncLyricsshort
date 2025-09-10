
import React, { useState } from 'react';
import CopyIcon from '../icons/CopyIcon';
import DownloadIcon from '../icons/DownloadIcon';
import { parseLrcText } from './utils';

const MusixmatchConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [lrcInput, setLrcInput] = useState('');
    const [draftInput, setDraftInput] = useState('');
    const [draftOutput, setDraftOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleConvert = () => {
        setError('');
        setDraftOutput('');

        try {
            const lrcData = parseLrcText(lrcInput);
            if (lrcData.length === 0) throw new Error("Неверный или пустой LRC.");
            
            const draftData = JSON.parse(draftInput);
            if (!draftData.subtitles || !Array.isArray(draftData.subtitles)) {
                throw new Error("Неверный формат Draft JSON: массив 'subtitles' не найден.");
            }

            const newDraft = JSON.parse(JSON.stringify(draftData));
            
            let lrcIndex = 0;
            
            // Проходим по всем строкам черновика
            for (const subtitle of newDraft.subtitles) {
                if (lrcIndex >= lrcData.length) break; 

                const draftText = (subtitle.text || '').trim().toUpperCase();
                const lrcLine = lrcData[lrcIndex];

                // Если в LRC строка пустая, это #INSTRUMENTAL
                if (lrcLine.text === '') {
                     if (draftText === '#INSTRUMENTAL') {
                        subtitle.time = lrcLine.time;
                        lrcIndex++;
                    }
                    // Если #INSTRUMENTAL в черновике нет, просто пропускаем эту строку LRC
                    continue; 
                }

                // Если в LRC есть текст, присваиваем время строке с текстом в черновике
                if (draftText && draftText !== '...' && draftText !== 'END' && draftText !== '#INSTRUMENTAL') {
                    subtitle.time = lrcLine.time;
                    lrcIndex++;
                }
            }

            // Обработка последнего пустого тега для END
            const lastLrcLine = lrcData[lrcData.length - 1];
            const endSubtitle = newDraft.subtitles.find((sub: any) => (sub.text || '').trim().toUpperCase() === 'END');
            
            if (endSubtitle && lastLrcLine && lastLrcLine.text === '') {
                // Убедимся, что время последнего тега больше, чем у предпоследней строки
                const secondToLastTime = lrcData.length > 1 ? lrcData[lrcData.length - 2].time : 0;
                if(lastLrcLine.time > secondToLastTime) {
                    endSubtitle.time = lastLrcLine.time;
                }
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
         <div className="h-full flex flex-col p-6 gap-6 bg-black/20 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                 <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-white">Musixmatch конвертер (LRC → Draft JSON)</h2>
                    <p className="text-gray-300 text-sm">Вставьте содержимое LRC и JSON-черновика, чтобы объединить их.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="flex flex-col gap-2">
                    <label htmlFor="lrc-input" className="text-sm font-medium text-gray-200">1. LRC-файл</label>
                    <textarea 
                        id="lrc-input"
                        value={lrcInput}
                        onChange={(e) => setLrcInput(e.target.value)}
                        placeholder="Вставьте сюда содержимое .lrc файла"
                        className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="draft-input" className="text-sm font-medium text-gray-200">2. Draft JSON</label>
                    <textarea
                        id="draft-input"
                        value={draftInput}
                        onChange={(e) => setDraftInput(e.target.value)}
                        placeholder="Вставьте сюда содержимое JSON-черновика Musixmatch"
                        className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            </div>

            <div className="flex-shrink-0 text-center">
                <button 
                    onClick={handleConvert}
                    className="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!lrcInput || !draftInput}
                >
                    Конвертировать
                </button>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {draftOutput && (
                <div className="flex flex-col gap-2 flex-grow min-h-0">
                    <div className="flex justify-between items-center">
                        <label htmlFor="output-json" className="text-sm font-medium text-gray-200">3. Результат</label>
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
                        id="output-json"
                        readOnly
                        value={draftOutput}
                        className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md resize-none custom-scrollbar text-sm font-mono"
                    />
                </div>
            )}
        </div>
    )
};

export default MusixmatchConverter;
