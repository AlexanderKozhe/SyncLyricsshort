
import React, { useState, useRef, useEffect, useCallback } from 'react';
import SpinnerIcon from '../icons/SpinnerIcon';

// --- Функции для работы со временем (улучшенные) ---

const timeStringToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    try {
        if (parts.length === 3) { // HH:MM:SS.ms
            return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
        }
        if (parts.length === 2) { // MM:SS.ms
            return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
        }
        return parseFloat(timeStr); // SS.ms
    } catch (e) {
        console.error(`Invalid time format: ${timeStr}`);
        return 0;
    }
};

const secondsToTimeString = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const totalMs = Math.round(seconds * 1000);
    const ms = totalMs % 1000;
    const totalSeconds = Math.floor(totalMs / 1000);
    const s = totalSeconds % 60;
    const m = Math.floor(totalSeconds / 60) % 60;
    const h = Math.floor(totalSeconds / 3600);

    const paddedMs = String(ms).padStart(3, '0');
    const paddedS = String(s).padStart(2, '0');
    const paddedM = String(m).padStart(2, '0');

    if (h > 0) {
        return `${h}:${paddedM}:${paddedS}.${paddedMs}`;
    }
    return `${m}:${paddedS}.${paddedMs}`;
};


// --- Внутренние типы данных ---

interface Word {
    id: string;
    text: string;
    begin: number; // в секундах
    end: number;   // в секундах
}

interface Line {
    id: string;
    words: Word[];
    originalAttributes: Record<string, string>;
}

// --- Компонент-редактор для одного слова ---

const WordEditor = ({ word, onUpdate, onCancel }: { word: Word; onUpdate: (begin: number, end: number) => void; onCancel: () => void; }) => {
    const [begin, setBegin] = useState(secondsToTimeString(word.begin));
    const [end, setEnd] = useState(secondsToTimeString(word.end));

    const adjustTime = (setter: React.Dispatch<React.SetStateAction<string>>, amount: number) => {
        setter(prev => secondsToTimeString(timeStringToSeconds(prev) + amount));
    };

    const handleSave = () => {
        onUpdate(timeStringToSeconds(begin), timeStringToSeconds(end));
    };

    return (
        <div className="absolute z-10 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg -mt-24 ml-4 flex items-center space-x-2 animate-fade-in-fast">
            <div>
                <label className='text-xs text-gray-400'>Begin</label>
                <input type="text" value={begin} onChange={e => setBegin(e.target.value)} className="bg-gray-900 text-white p-1 rounded-md w-28 font-mono"/>
                <button onClick={() => adjustTime(setBegin, 0.01)} className="px-1 bg-gray-700 rounded">+10ms</button>
                <button onClick={() => adjustTime(setBegin, -0.01)} className="px-1 bg-gray-700 rounded ml-1">-10ms</button>
            </div>
            <div>
                <label className='text-xs text-gray-400'>End</label>
                <input type="text" value={end} onChange={e => setEnd(e.target.value)} className="bg-gray-900 text-white p-1 rounded-md w-28 font-mono"/>
                <button onClick={() => adjustTime(setEnd, 0.01)} className="px-1 bg-gray-700 rounded">+10ms</button>
                <button onClick={() => adjustTime(setEnd, -0.01)} className="px-1 bg-gray-700 rounded ml-1">-10ms</button>
            </div>
            <div className='flex flex-col space-y-1 self-end'>
                 <button onClick={handleSave} className="px-3 py-1 bg-green-600 rounded-md text-sm">Save</button>
                 <button onClick={onCancel} className="px-3 py-1 bg-gray-600 rounded-md text-sm">Cancel</button>
            </div>
        </div>
    );
}

// --- Основной компонент ---

const WordSync: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [lines, setLines] = useState<Line[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [finalTtml, setFinalTtml] = useState<string | null>(null);

    const [activeWordIndex, setActiveWordIndex] = useState<{line: number, word: number} | null>(null);
    const [editingWord, setEditingWord] = useState<{line: number, word: number} | null>(null);

    const [originalTtmlStructure, setOriginalTtmlStructure] = useState<Document | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const activeWordRef = useRef<HTMLSpanElement>(null);

    // --- Парсинг и генерация --- 

    const parseTtml = (xmlString: string) => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlString, "application/xml");
            if (doc.getElementsByTagName("parsererror").length) {
                throw new Error("Ошибка в структуре XML файла.");
            }
            setOriginalTtmlStructure(doc);

            const extractedLines: Line[] = [];
            const pElements = Array.from(doc.getElementsByTagName('p'));
            
            pElements.forEach((p, lineIndex) => {
                const line: Line = {
                    id: `l-${lineIndex}`,
                    words: [],
                    originalAttributes: Array.from(p.attributes).reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
                };

                const spans = Array.from(p.getElementsByTagName('span'));
                if (spans.length > 0) {
                     spans.forEach((span, wordIndex) => {
                        line.words.push({ 
                            id: `w-${lineIndex}-${wordIndex}`,
                            text: span.textContent || '',
                            begin: timeStringToSeconds(span.getAttribute('begin') || ''),
                            end: timeStringToSeconds(span.getAttribute('end') || '')
                        });
                     });
                } else {
                    const textContent = p.textContent || '';
                    textContent.trim().split(/\s+/).forEach((wordText, wordIndex) => {
                        line.words.push({ 
                            id: `w-${lineIndex}-${wordIndex}`,
                            text: wordText,
                            begin: 0, end: 0 
                        });
                    });
                }
                extractedLines.push(line);
            });
            setLines(extractedLines);
        } catch (e: any) {
            setError(`Не удалось прочитать TTML: ${e.message}`);
            setLines([]);
        }
    };

    const generateTtml = () => {
        if (!originalTtmlStructure || !lines.length) return;
        const doc = originalTtmlStructure.cloneNode(true) as Document;
        const pElements = Array.from(doc.getElementsByTagName('p'));

        pElements.forEach((p, lineIndex) => {
            const line = lines[lineIndex];
            p.innerHTML = ''; // Очищаем старые span и текст
            line.words.forEach(word => {
                const span = doc.createElementNS("http://www.w3.org/ns/ttml", "span");
                span.setAttribute('begin', secondsToTimeString(word.begin));
                span.setAttribute('end', secondsToTimeString(word.end));
                span.textContent = word.text;
                p.appendChild(span);
                p.appendChild(doc.createTextNode(' ')); // Пробел между словами
            })
        });

        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(doc);
        setFinalTtml('<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString);
    };


    // --- Логика синхронизации ---
    const handleSync = useCallback(() => {
        if (!audioRef.current || !lines.length) return;

        if (!activeWordIndex) { // Старт
            audioRef.current.play();
            setActiveWordIndex({ line: 0, word: 0 });
            return;
        }

        const currentTime = audioRef.current.currentTime;
        let nextLine = activeWordIndex.line;
        let nextWord = activeWordIndex.word;

        setLines(prevLines => {
            const newLines = [...prevLines];
            const line = newLines[activeWordIndex.line];
            const word = line.words[activeWordIndex.word];
            word.begin = currentTime;
            // Обновляем конец предыдущего слова
            if (activeWordIndex.word > 0) {
                line.words[activeWordIndex.word - 1].end = currentTime;
            } else if (activeWordIndex.line > 0) {
                const prevLine = newLines[activeWordIndex.line - 1];
                prevLine.words[prevLine.words.length - 1].end = currentTime;
            }
            return newLines;
        });

        if (nextWord + 1 < lines[nextLine].words.length) {
            nextWord++;
        } else if (nextLine + 1 < lines.length) {
            nextLine++;
            nextWord = 0;
        } else { // Конец
            audioRef.current.pause();
            return;
        }
        setActiveWordIndex({ line: nextLine, word: nextWord });

    }, [audioRef, lines, activeWordIndex]);

    // --- Эффекты и обработчики ---

    const handleWordClick = (lineIndex: number, wordIndex: number) => {
        setEditingWord({ line: lineIndex, word: wordIndex });
        if (audioRef.current) {
            const word = lines[lineIndex].words[wordIndex];
            if (word.begin > 0) { // Не перематываем на 0, если время не установлено
              audioRef.current.currentTime = word.begin;
              audioRef.current.play();
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !editingWord) {
                e.preventDefault();
                handleSync();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSync, editingWord]);

    useEffect(() => {
        activeWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeWordIndex]);

    const handleUpdateWord = (lineIndex: number, wordIndex: number, begin: number, end: number) => {
        setLines(prev => {
            const newLines = [...prev];
            newLines[lineIndex].words[wordIndex].begin = begin;
            newLines[lineIndex].words[wordIndex].end = end;
            return newLines;
        })
        setEditingWord(null);
    };
    
    // ... UI-компоненты (рендер) ...

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-white hover:text-[#FF553E] transition-colors"> &larr; Назад </button>
            <h3 className="text-2xl font-bold text-white mb-6">Синхронизация пословно</h3>

            { (isLoading) ? <SpinnerIcon /> : (error) ? <p className='text-red-400'>{error}</p> : <></>}

            { !finalTtml ?
              (!lines.length ? (
                  <div className="bg-black/20 p-8 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h4 className="text-xl font-semibold text-white mb-4">Шаг 1: Загрузите TTML</h4>
                          <input type="file" accept=".ttml,.xml" onChange={async e => { setIsLoading(true); const text = await e.target.files![0].text(); parseTtml(text); setIsLoading(false); }} disabled={isLoading} />
                      </div>
                      <div>
                          <h4 className="text-xl font-semibold text-white mb-4">Шаг 2: Загрузите Аудио</h4>
                          <input type="file" accept="audio/*" onChange={e => { if(e.target.files) setAudioFile(e.target.files[0])} } />
                      </div>
                  </div>
              ) : (
                  <div className="bg-black/20 p-8 rounded-lg">
                      <div className='flex justify-between items-center mb-4'>
                          <h4 className="text-xl font-semibold text-white">Нажимайте 'Пробел' или редактируйте слова</h4>
                          <button onClick={generateTtml} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Завершить и сгенерировать TTML</button>
                      </div>
                      {audioFile && <audio ref={audioRef} src={URL.createObjectURL(audioFile)} controls className="w-full mb-6" />}
                      <div className="mt-4 bg-black/30 p-4 rounded-md text-white overflow-auto max-h-[60vh] text-2xl leading-loose">
                          {lines.map((line, lineIndex) => (
                              <p key={line.id} className="transition-colors duration-200 p-2" style={{backgroundColor: activeWordIndex?.line === lineIndex ? 'rgba(255, 85, 62, 0.1)' : 'transparent'}}>
                                  {line.words.map((word, wordIndex) => {
                                      const isCurrent = activeWordIndex?.line === lineIndex && activeWordIndex?.word === wordIndex;
                                      const isEditing = editingWord?.line === lineIndex && editingWord?.word === wordIndex;
                                      return (
                                        <span key={word.id} className='relative'>
                                          <span ref={isCurrent ? activeWordRef : null} onClick={() => handleWordClick(lineIndex, wordIndex)} className={`cursor-pointer transition-colors duration-200 rounded px-1 ${isCurrent ? 'bg-[#FF553E] text-black' : 'hover:bg-white/20'} ${isEditing ? 'bg-blue-500' : ''}`}>
                                              {word.text}
                                          </span>
                                          {isEditing && <WordEditor word={word} onCancel={() => setEditingWord(null)} onUpdate={(b,e) => handleUpdateWord(lineIndex, wordIndex, b, e)} />}
                                        </span>
                                      );
                                  })}
                              </p>
                          ))}
                      </div>
                  </div>
              ))
            :
            (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Результат</h3>
                <textarea readOnly value={finalTtml} className="w-full h-96 bg-black/30 p-4 rounded-md text-white font-mono text-sm" />
                <div className="mt-4 space-x-4">
                    <button onClick={() => setFinalTtml(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors">&larr; Назад к редактору</button>
                    <button onClick={() => navigator.clipboard.writeText(finalTtml)} className="bg-[#FF553E] hover:bg-[#ff7b6b] text-white font-bold py-2 px-4 rounded-md transition-colors">Копировать</button>
                </div>
              </div>
            )}
        </div>
    );
};

export default WordSync;
