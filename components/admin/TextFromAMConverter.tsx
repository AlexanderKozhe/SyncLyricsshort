
import React, { useState } from 'react';
import CopyIcon from '../icons/CopyIcon';
import DownloadIcon from '../icons/DownloadIcon';

const TextFromAMConverter: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [url, setUrl] = useState('');
    const [outputs, setOutputs] = useState<{ ttml: string; lrc: string; txt: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedFormat, setCopiedFormat] = useState<'ttml' | 'lrc' | 'txt' | null>(null);

    const handleFetchLyrics = async () => {
        if (!url) {
            setError('Пожалуйста, вставьте URL.');
            return;
        }
        setIsLoading(true);
        setError('');
        setOutputs(null);

        try {
            const response = await fetch('/api/getAppleMusicLyrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Произошла неизвестная ошибка.');
            }

            setOutputs({
                ttml: data.ttml || '',
                lrc: data.lrc || '',
                txt: data.txt || '',
            });

        } catch (e: any) {
            setError(`Ошибка: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, format: 'ttml' | 'lrc' | 'txt') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    const handleDownload = (text: string, format: 'lrc' | 'txt' | 'ttml') => {
        if (!text) return;
        let blob: Blob;
        let filename: string;

        switch (format) {
            case 'lrc':
                blob = new Blob([text.replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' });
                filename = 'lyrics.lrc';
                break;
            case 'txt':
                blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                filename = 'lyrics.txt';
                break;
            case 'ttml':
                 blob = new Blob([text], { type: 'application/xml;charset=utf-8' });
                 filename = 'lyrics.ttml';
                 break;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const OutputBlock: React.FC<{
        title: string;
        value: string;
        format: 'ttml' | 'lrc' | 'txt';
    }> = ({ title, value, format }) => (
        <div className="flex flex-col gap-2 flex-grow min-h-[250px]">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-200">{title}</label>
                {value && (
                     <div className="flex gap-2">
                        <button onClick={() => handleCopy(value, format)} className="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors" title="Копировать">
                            <CopyIcon copied={copiedFormat === format} />
                        </button>
                        <button onClick={() => handleDownload(value, format)} className="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors" title="Скачать">
                            <DownloadIcon />
                        </button>
                    </div>
                )}
            </div>
             <textarea
                id={`output-${format}`}
                readOnly
                value={value}
                className="h-full w-full p-3 bg-black/40 border border-white/10 rounded-md resize-none custom-scrollbar text-sm font-mono"
            />
        </div>
    );

    return (
        <div className="h-full flex flex-col p-6 gap-6 bg-black/20 rounded-lg">
            <div className="flex-shrink-0 flex items-center gap-4">
                <button onClick={onBack} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">&larr; Назад</button>
                <div>
                    <h2 className="text-xl font-semibold text-white">Get Text from Apple Music</h2>
                    <p className="text-gray-300 text-sm">Вставьте URL песни из Apple Music, чтобы получить текст в TTML, LRC и TXT.</p>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="am-url-input" className="text-sm font-medium text-gray-200">1. URL песни</label>
                <div className="flex gap-2">
                     <input
                        id="am-url-input"
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://music.apple.com/ru/song/..."
                        className="flex-grow p-3 bg-black/40 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] text-sm font-mono"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleFetchLyrics}
                        className="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !url}
                    >
                        {isLoading ? 'Загрузка...' : 'Получить'}
                    </button>
                </div>
                 {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            {(outputs || isLoading) && (
                <div className="flex flex-col gap-4 flex-grow min-h-0">
                    <h3 className="text-sm font-medium text-gray-200">2. Результат</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-300">
                           <p>Получение текста с серверов Apple и конвертация...</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow min-h-0">
                            <OutputBlock title="Результат (TTML)" format="ttml" value={outputs?.ttml ?? ''} />
                            <OutputBlock title="Результат (LRC)" format="lrc" value={outputs?.lrc ?? ''} />
                            <OutputBlock title="Результат (TXT)" format="txt" value={outputs?.txt ?? ''} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextFromAMConverter;
