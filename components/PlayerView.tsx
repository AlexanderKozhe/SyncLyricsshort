import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SyncedLine } from '../types';

interface PlayerViewProps {
    lines: SyncedLine[];
    audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerView: React.FC<PlayerViewProps> = ({ lines, audioRef }) => {
    const [activeLineId, setActiveLineId] = useState<string | null>(null);
    const activeLineRef = useRef<HTMLParagraphElement>(null);
    // FIX: Explicitly initialize useRef with null and provide a more accurate type.
    const animationFrameId = useRef<number | null>(null);

    const checkActiveLine = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            return;
        };

        const currentTime = audio.currentTime;
        const currentLine = lines.find(line =>
            line.begin !== null && line.end !== null &&
            currentTime >= line.begin && currentTime < line.end
        );
        
        const newActiveId = currentLine ? currentLine.id : null;
        
        setActiveLineId(prevId => {
            if (prevId !== newActiveId) {
                return newActiveId;
            }
            return prevId;
        });

        animationFrameId.current = requestAnimationFrame(checkActiveLine);
    }, [lines, audioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const startAnimation = () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = requestAnimationFrame(checkActiveLine);
        };
        const stopAnimation = () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

        const handleSeek = () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            checkActiveLine();
            if (audio.paused) {
                stopAnimation();
            }
        }

        audio.addEventListener('play', startAnimation);
        audio.addEventListener('playing', startAnimation);
        audio.addEventListener('pause', stopAnimation);
        audio.addEventListener('ended', stopAnimation);
        audio.addEventListener('seeked', handleSeek);

        handleSeek();

        return () => {
            stopAnimation();
            audio.removeEventListener('play', startAnimation);
            audio.removeEventListener('playing', startAnimation);
            audio.removeEventListener('pause', stopAnimation);
            audio.removeEventListener('ended', stopAnimation);
            audio.removeEventListener('seeked', handleSeek);
        };
    }, [checkActiveLine, audioRef]);


    useEffect(() => {
        activeLineRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, [activeLineId]);

    const handleLineClick = (line: SyncedLine) => {
        if (audioRef.current && line.begin !== null) {
            audioRef.current.currentTime = line.begin;
            if (audioRef.current.paused) {
                audioRef.current.play().catch(console.error);
            }
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-semibold text-slate-200">Шаг 5: Плеер</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Просмотр синхронизированного текста в реальном времени.
                    </p>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar p-8">
                <div className="text-center space-y-4">
                    {lines.map((line) => {
                        const isActive = line.id === activeLineId;
                        const isPast = !isActive && line.end !== null && audioRef.current && line.end < audioRef.current.currentTime;

                        // Only render lines with timestamps and text
                        if (line.begin === null || line.text.trim() === '') return null;
                        
                        return (
                            <p
                                key={line.id}
                                ref={isActive ? activeLineRef : null}
                                onClick={() => handleLineClick(line)}
                                className={`
                                    text-lg md:text-xl font-semibold transition-all duration-300 ease-in-out cursor-pointer
                                    whitespace-pre-wrap break-words
                                    ${isActive ? 'text-white scale-105' : ''}
                                    ${isPast ? 'text-slate-500' : 'text-slate-400 hover:text-slate-200'}
                                `}
                            >
                                {line.text}
                            </p>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlayerView;
