import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';

interface AudioPlayerProps {
  src: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  onLoadedMetadata: (event: React.SyntheticEvent<HTMLAudioElement, Event>) => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, audioRef, onLoadedMetadata }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const progressRef = useRef<HTMLInputElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const isSeeking = useRef(false);

  // High-frequency visual updates via requestAnimationFrame.
  // This function only performs direct DOM manipulation and avoids React state updates
  // to prevent re-renders and ensure smoothness.
  const updateProgress = useCallback(() => {
    if (audioRef.current && progressRef.current) {
      // During playback, update the slider's value directly from the audio element.
      if (!isSeeking.current) {
        progressRef.current.value = String(audioRef.current.currentTime);
      }
      
      // Always update the progress bar fill to match the slider's current value.
      // This ensures the fill is correct both during playback and while seeking.
      if (duration > 0) {
        const progress = (Number(progressRef.current.value) / duration) * 100;
        progressRef.current.style.setProperty('--seek-before-width', `${progress}%`);
      }
    }
    animationFrameId.current = requestAnimationFrame(updateProgress);
  }, [audioRef, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Low-frequency state updates for the time display, preventing re-renders in the animation loop.
    const handleTimeUpdate = () => {
        if (!isSeeking.current) {
            setCurrentTime(audio.currentTime);
        }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Animation frame management
    const startAnimation = () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(updateProgress);
    };
    const stopAnimation = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
    
    audio.addEventListener('play', startAnimation);
    audio.addEventListener('playing', startAnimation);
    audio.addEventListener('pause', stopAnimation);
    audio.addEventListener('ended', stopAnimation);

    return () => {
      stopAnimation();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', startAnimation);
      audio.removeEventListener('playing', startAnimation);
      audio.removeEventListener('pause', stopAnimation);
      audio.removeEventListener('ended', stopAnimation);
    };
  }, [audioRef, updateProgress]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [audioRef, isPlaying]);

  const handlePlaybackRateChange = (rate: number) => {
    if (audioRef.current) {
        audioRef.current.playbackRate = rate;
        setPlaybackRate(rate);
    }
  };
  
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
    onLoadedMetadata(e);
  };
  
  const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    // Update the time display state immediately for responsiveness during seeking.
    setCurrentTime(newTime);
    if (audioRef.current) {
        audioRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space' && e.target === document.body) {
              e.preventDefault();
              togglePlayPause();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
      };
  }, [togglePlayPause]);

  return (
    <footer className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 shadow-lg flex-shrink-0">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="w-full flex items-center gap-4">
        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-lg shadow-sky-500/20"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className="text-sm font-mono text-slate-400 tabular-nums">{formatTime(currentTime)}</span>
        <input
          ref={progressRef}
          type="range"
          min="0"
          max={duration || 0}
          defaultValue="0"
          onInput={handleSeekInput}
          onMouseDown={() => { isSeeking.current = true; }}
          onMouseUp={() => { isSeeking.current = false; }}
          onTouchStart={() => { isSeeking.current = true; }}
          onTouchEnd={() => { isSeeking.current = false; }}
          className="w-full custom-range"
        />
        <span className="text-sm font-mono text-slate-400 tabular-nums">{formatTime(duration)}</span>

        <div className="flex items-center gap-1.5 bg-slate-700/50 p-1 rounded-lg">
            <button onClick={() => handlePlaybackRateChange(0.75)} className={`px-2 py-0.5 text-xs font-mono rounded-md transition-colors ${playbackRate === 0.75 ? 'bg-sky-500 text-white' : 'hover:bg-slate-600 text-slate-300'}`}>0.75x</button>
            <button onClick={() => handlePlaybackRateChange(1)} className={`px-2 py-0.5 text-xs font-mono rounded-md transition-colors ${playbackRate === 1 ? 'bg-sky-500 text-white' : 'hover:bg-slate-600 text-slate-300'}`}>1x</button>
            <button onClick={() => handlePlaybackRateChange(1.25)} className={`px-2 py-0.5 text-xs font-mono rounded-md transition-colors ${playbackRate === 1.25 ? 'bg-sky-500 text-white' : 'hover:bg-slate-600 text-slate-300'}`}>1.25x</button>
        </div>
      </div>
    </footer>
  );
};

export default AudioPlayer;