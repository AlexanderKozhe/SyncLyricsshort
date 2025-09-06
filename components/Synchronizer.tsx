import React, { useState, useEffect, useRef } from 'react';
import { SyncedLine } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SparklesIcon from './icons/SparklesIcon';

interface SynchronizerProps {
  lines: SyncedLine[];
  setLines: React.Dispatch<React.SetStateAction<SyncedLine[]>>;
  audioRef: React.RefObject<HTMLAudioElement>;
  onToggleHelper: () => void;
  scrollToLineIndex: number | null;
}

const formatTime = (seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return '--:--.--';
    const totalSecondsValue = Math.max(0, seconds);

    const totalCentiseconds = Math.round(totalSecondsValue * 100);
    const centiseconds = totalCentiseconds % 100;
    
    const totalOverallSeconds = Math.floor(totalCentiseconds / 100);
    const s = totalOverallSeconds % 60;
    const m = Math.floor(totalOverallSeconds / 60);

    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

const Synchronizer: React.FC<SynchronizerProps> = ({ lines, setLines, audioRef, onToggleHelper, scrollToLineIndex }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const stopPlaybackAt = useRef<number | null>(null);

  const playSegment = (startTime: number | null, endTime: number | null = null) => {
      if (audioRef.current && startTime !== null) {
          stopPlaybackAt.current = endTime;
          audioRef.current.currentTime = startTime;
          audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
      }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const timeUpdateHandler = () => {
        if (stopPlaybackAt.current !== null && audio.currentTime >= stopPlaybackAt.current) {
            audio.pause();
            stopPlaybackAt.current = null;
        }
    };
    
    const pauseHandler = () => {
        stopPlaybackAt.current = null;
    }

    audio.addEventListener('timeupdate', timeUpdateHandler);
    audio.addEventListener('pause', pauseHandler);

    return () => {
        audio.removeEventListener('timeupdate', timeUpdateHandler);
        audio.removeEventListener('pause', pauseHandler);
    };
  }, [audioRef]);

  useEffect(() => {
    if (scrollToLineIndex !== null) {
      setActiveIndex(scrollToLineIndex);
    }
  }, [scrollToLineIndex]);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex]);
  
  useEffect(() => {
    if (focusIndex !== null && activeLineRef.current) {
      const input = activeLineRef.current.querySelector('input');
      if (input) {
        input.focus();
        if (cursorPosition !== null) {
          input.setSelectionRange(cursorPosition, cursorPosition);
          setCursorPosition(null);
        }
      }
      setFocusIndex(null);
    }
  }, [focusIndex, lines, cursorPosition]);

  const handleSyncAction = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    const currentLine = lines[activeIndex];

    if (!currentLine || currentLine.text.trim() === '') return;

    const syncMode = (currentLine.text.trim() !== '' && currentLine.begin !== null && currentLine.end === null) ? 'end' : 'begin';

    if (syncMode === 'begin') {
      setLines(prevLines => prevLines.map((line, index) =>
        index === activeIndex ? { ...line, begin: currentTime, end: null } : line
      ));
    } else { // syncMode === 'end'
      setLines(prevLines => prevLines.map((line, index) => {
        if (index === activeIndex) {
          return (line.begin !== null && currentTime > line.begin)
            ? { ...line, end: currentTime }
            : line;
        }
        return line;
      }));
      
      const nextNonEmptyIndex = lines.findIndex((line, index) => index > activeIndex && line.text.trim() !== '');
      if (nextNonEmptyIndex !== -1) {
        setActiveIndex(nextNonEmptyIndex);
      }
    }
  };

  const findPrevTimestampedLine = (startIndex: number): SyncedLine | null => {
    for (let i = startIndex - 1; i >= 0; i--) {
        if (lines[i] && lines[i].end !== null) {
            return lines[i];
        }
    }
    return null;
  };

  const findNextTimestampedLine = (startIndex: number): SyncedLine | null => {
      for (let i = startIndex + 1; i < lines.length; i++) {
          if (lines[i] && lines[i].begin !== null) {
              return lines[i];
          }
      }
      return null;
  };


  const adjustTime = (index: number, type: 'begin' | 'end', amount: number) => {
    setActiveIndex(index);
    const line = lines[index];
    const originalTime = line[type];
    if (originalTime === null) return;

    let newTime = originalTime + amount;

    // Ограничение 1: Время не может быть отрицательным
    newTime = Math.max(0, newTime);

    // Ограничение 2: Поддерживать минимальный зазор в 0.1с внутри самой строки
    if (type === 'begin' && line.end !== null) {
      newTime = Math.min(newTime, line.end - 0.1);
    } else if (type === 'end' && line.begin !== null) {
      newTime = Math.max(newTime, line.begin + 0.1);
    }

    // Ограничение 3: Поддерживать минимальный зазор в 0.1с с соседними строками
    if (type === 'begin') {
      const prevLine = findPrevTimestampedLine(index);
      if (prevLine && prevLine.end !== null) {
        newTime = Math.max(newTime, prevLine.end + 0.1);
      }
    } else { // type === 'end'
      const nextLine = findNextTimestampedLine(index);
      if (nextLine && nextLine.begin !== null) {
        newTime = Math.min(newTime, nextLine.begin - 0.1);
      }
    }
    
    if (isNaN(newTime)) return;
    const finalNewTime = parseFloat(newTime.toFixed(3));

    const hasChanged = originalTime.toFixed(3) !== finalNewTime.toFixed(3);

    if (hasChanged) {
        setLines(prevLines =>
            prevLines.map((l, i) =>
                i === index ? { ...l, [type]: finalNewTime } : l
            )
        );
    }
    
    // Determine playback segment and play
    const playbackStartTime = finalNewTime;
    let playbackEndTime: number | null = null;
    
    if (type === 'begin') {
        const currentEnd = line.end;
        playbackEndTime = currentEnd !== null && playbackStartTime < currentEnd ? currentEnd : null;
    } else { // 'end'
        const nextLine = findNextTimestampedLine(index);
        if (nextLine && nextLine.begin !== null) {
            playbackEndTime = nextLine.begin;
        } else if (audioRef.current) {
            playbackEndTime = audioRef.current.duration;
        }
    }

    playSegment(playbackStartTime, playbackEndTime);
  };
  
  const handleLineClick = (index: number) => {
    setActiveIndex(index);
    const line = lines[index];
    playSegment(line.begin, line.end);
  };

  const handlePlayFromEnd = (index: number) => {
    setActiveIndex(index);
    const line = lines[index];
    if (line.end === null) return;

    const nextLine = findNextTimestampedLine(index);
    const audio = audioRef.current;

    let stopTime: number | null = null;
    if (nextLine && nextLine.begin !== null) {
        stopTime = nextLine.begin;
    } else if (audio) {
        stopTime = audio.duration;
    }
    
    playSegment(line.end, stopTime);
  };

  const handleLineTextChange = (id: string, newText: string) => {
    setLines(prevLines =>
      prevLines.map(line => (line.id === id ? { ...line, text: newText } : line))
    );
  };
  
  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const line = lines[index];

    if (e.key === 'Enter') {
        e.preventDefault();
        const cursorPosition = e.currentTarget.selectionStart ?? line.text.length;
        const textBefore = line.text.substring(0, cursorPosition);
        const textAfter = line.text.substring(cursorPosition);

        setLines(currentLines => {
            const newLines = [...currentLines];
            newLines[index] = { ...newLines[index], text: textBefore };
            const newLine: SyncedLine = {
                id: `${Date.now()}-${index + 1}`,
                text: textAfter,
                begin: null,
                end: null,
            };
            newLines.splice(index + 1, 0, newLine);
            return newLines;
        });

        setActiveIndex(index + 1);
        setFocusIndex(index + 1);
        setCursorPosition(0);
    } else if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0 && index > 0) {
        e.preventDefault();
        const prevIndex = index - 1;
        
        const prevLine = lines[prevIndex];
        const newCursorPos = prevLine.text.length;

        setLines(currentLines => {
            const newLines = [...currentLines];
            const currentLine = newLines[index];
            newLines[prevIndex] = { ...newLines[prevIndex], text: newLines[prevIndex].text + currentLine.text };
            newLines.splice(index, 1);
            return newLines;
        });
        
        setActiveIndex(prevIndex);
        setFocusIndex(prevIndex);
        setCursorPosition(newCursorPos);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Enter') { e.preventDefault(); handleSyncAction(); }
      if (e.code === 'ArrowUp') { 
        e.preventDefault(); 
        if (activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
        }
      }
      if (e.code === 'ArrowDown') { 
        e.preventDefault(); 
        if (activeIndex < lines.length - 1) {
            setActiveIndex(activeIndex + 1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, lines, handleSyncAction]);

  const currentLine = lines[activeIndex];
  const syncMode = (currentLine?.text.trim() !== '' && currentLine?.begin !== null && currentLine?.end === null) ? 'end' : 'begin';

  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-lg overflow-hidden relative">
      <div className="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">Шаг 3: Синхронизация</h2>
          <p className="text-sm text-slate-400 mt-1">
            Используйте <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded-md text-sky-400 mx-1">Enter</span> для синхронизации,
            <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded-md text-sky-400 mx-1">↑ ↓</span> для навигации.
          </p>
        </div>
         <button
          onClick={onToggleHelper}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium transition-all duration-300 ease-in-out bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
          title="Помощник по форматированию"
        >
          <SparklesIcon />
          <span>Помощник</span>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar p-2 pb-24">
        <div className="space-y-2">
          {lines.map((line, index) => {
            const isEmpty = line.text.trim() === '';
            return (
              <div key={line.id} ref={index === activeIndex ? activeLineRef : null} onClick={() => handleLineClick(index)}
                className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                  index === activeIndex ? 'bg-sky-500/20 ring-2 ring-sky-500' : 'bg-slate-700/50 hover:bg-slate-700'
                } ${isEmpty && index !== activeIndex ? 'opacity-60' : ''}`}>
                <div 
                  onClick={(e) => { e.stopPropagation(); handleLineClick(index); }}
                  className="text-sm font-mono text-slate-400 w-8 text-center flex-shrink-0 hover:text-sky-400 transition-colors"
                  title="Воспроизвести отрезок"
                  >
                  {index + 1}
                </div>
                <input type="text" value={line.text} 
                  onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(e, index)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-grow bg-transparent focus:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-sky-600 rounded px-2 py-1 -my-1"/>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-xs text-slate-400">Начало</span>
                    <div className="flex items-center gap-1 font-mono text-sm">
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(index, 'begin', -0.1); }} disabled={line.begin === null || isEmpty} className="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&lt;</button>
                      <button onClick={(e) => { e.stopPropagation(); handleLineClick(index); }} className="text-sky-400 w-20 text-center tabular-nums rounded hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={line.begin === null || isEmpty} title="Воспроизвести отрезок">{formatTime(line.begin)}</button>
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(index, 'begin', 0.1); }} disabled={line.begin === null || isEmpty} className="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&gt;</button>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-400">Конец</span>
                    <div className="flex items-center gap-1 font-mono text-sm">
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(index, 'end', -0.1); }} disabled={line.end === null || isEmpty} className="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&lt;</button>
                      <button onClick={(e) => { e.stopPropagation(); handlePlayFromEnd(index); }} className="text-green-400 w-20 text-center tabular-nums rounded hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={line.end === null || isEmpty} title="Воспроизвести с конца строки">{formatTime(line.end)}</button>
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(index, 'end', 0.1); }} disabled={line.end === null || isEmpty} className="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&gt;</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 flex justify-center items-center">
        <button onClick={handleSyncAction} disabled={lines[activeIndex]?.text.trim() === ''}
          className={`flex items-center justify-center gap-3 w-48 h-14 rounded-xl text-lg font-semibold shadow-lg transform transition-all hover:scale-105 focus:outline-none focus:ring-4 ${
            syncMode === 'begin' ? 'bg-slate-200 text-slate-900 focus:ring-slate-400' : 'bg-sky-500 text-white focus:ring-sky-300'
          } disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none`}>
          {syncMode === 'begin' ? <ChevronUpIcon /> : <ChevronDownIcon />}
          <span>{syncMode === 'begin' ? 'Начало строки' : 'Конец строки'}</span>
        </button>
      </div>
    </div>
  );
};

export default Synchronizer;
