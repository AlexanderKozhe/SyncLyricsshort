import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Tab, SyncedLine, IssueType } from './types';
import Tabs from './components/Tabs';
import AudioUpload from './components/AudioUpload';
import TextEditor from './components/TextEditor';
import Synchronizer from './components/Synchronizer';
import ResultView from './components/ResultView';
import AudioPlayer from './components/AudioPlayer';
import FormattingHelper from './components/FormattingHelper';
import PlayerView from './components/PlayerView';
import { applyFix, applyFixAll } from './services/analysis';
import Modal from './components/Modal';
import AdminView from './components/AdminView';

const DRAFT_KEY = 'zion_sync_draft';

// FIX: Add props interface for user and onLogout from AuthGate to resolve type error.
interface AppProps {
  user?: { email: string | null };
  onLogout?: () => void;
}

const App: React.FC<AppProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Audio);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [lines, setLines] = useState<SyncedLine[]>([]);
  const [isFormattingHelperOpen, setIsFormattingHelperOpen] = useState(false);
  const [scrollToLineIndex, setScrollToLineIndex] = useState<number | null>(null);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [draftAudioName, setDraftAudioName] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [noAudioMode, setNoAudioMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textEditorRef = useRef<{ scrollToLine: (index: number) => void }>(null);
  
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const { lines: savedLines, audioFileName: savedAudioFileName } = JSON.parse(savedDraft);
        if (Array.isArray(savedLines) && savedLines.length > 0) {
          setLines(savedLines);
          setAudioFileName(savedAudioFileName);
          setDraftAudioName(savedAudioFileName);
          setShowDraftNotice(true);
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      if (lines.length > 0 || audioFileName) {
        const draft = JSON.stringify({ lines, audioFileName });
        localStorage.setItem(DRAFT_KEY, draft);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [lines, audioFileName]);


  const handleAudioUpload = (file: File) => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioFileName(file.name);
    setNoAudioMode(false);
    setActiveTab(Tab.Text);
    setShowDraftNotice(false);
  };

  const handleNoAudio = () => {
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setAudioDuration(0);
    setNoAudioMode(true);
    setActiveTab(Tab.Text);
    setShowDraftNotice(false);
  };
  
  const handleReset = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
    }
    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setLines([]);
    setAudioDuration(0);
    setActiveTab(Tab.Audio);
    setIsFormattingHelperOpen(false);
    setShowDraftNotice(false);
    setNoAudioMode(false);
    localStorage.removeItem(DRAFT_KEY);
  };
  
  const handleConfirmReset = () => {
    handleReset();
    setIsResetModalOpen(false);
  };

  const handleTextChange = (newText: string) => {
    const newTextLines = newText.split('\n');
    const oldLines = lines;

    const finalLines: SyncedLine[] = new Array(newTextLines.length).fill(null);
    const availableOldLines: (SyncedLine | null)[] = [...oldLines];

    // Фаза 1: Сопоставление по точному совпадению текста и индекса ("якоря")
    newTextLines.forEach((newLineText, index) => {
        if (index < availableOldLines.length && availableOldLines[index]?.text === newLineText) {
            finalLines[index] = availableOldLines[index]!;
            availableOldLines[index] = null; // Пометить как использованную
        }
    });

    // Фаза 2: Сопоставление по тексту (для перемещенных строк)
    finalLines.forEach((line, index) => {
        if (line === null) {
            const newLineText = newTextLines[index];
            const availableIndex = availableOldLines.findIndex(oldLine => oldLine && oldLine.text === newLineText);

            if (availableIndex !== -1) {
                finalLines[index] = availableOldLines[availableIndex]!;
                availableOldLines[availableIndex] = null; // Пометить как использованную
            }
        }
    });
    
    // Фаза 3: Создание новых строк для оставшихся
    finalLines.forEach((line, index) => {
        if (line === null) {
             finalLines[index] = {
                id: `${Date.now()}-${index}`,
                text: newTextLines[index],
                begin: null,
                end: null,
            };
        }
    });

    setLines(finalLines.filter(l => l)); // Фильтруем возможные null в конце
  };
  
  const handleLinesUpload = (newLines: SyncedLine[]) => {
    setLines(newLines);
    setActiveTab(Tab.Sync);
  };

  const textForEditor = useMemo(() => {
    return lines.map(line => line.text).join('\n');
  }, [lines]);

  const allLinesSynced = useMemo(() => {
      return lines.length > 0 && lines.every(line => line.text.trim() === '' || (line.begin !== null && line.end !== null));
  }, [lines]);

  const isTabDisabled = useCallback((tab: Tab) => {
    if (tab === Tab.Audio || tab === Tab.Admin) return false;

    // A source is either loaded audio, a draft, or explicit no-audio mode.
    const hasSource = !!audioUrl || showDraftNotice || noAudioMode;
    if (!hasSource) return true; // Disable everything but Audio if no source is selected

    const hasText = lines.length > 0;

    if (!hasText && (tab === Tab.Sync || tab === Tab.Result || tab === Tab.Player)) {
        return true; // These tabs require text
    }
    
    // Sync and Player specifically require an audio file.
    if (tab === Tab.Sync || tab === Tab.Player) {
        if (noAudioMode || !audioUrl) return true;
    }
   
    // Player additionally requires all lines to be synced.
    if (tab === Tab.Player && !allLinesSynced) return true;

    return false;
  }, [audioUrl, lines, showDraftNotice, allLinesSynced, noAudioMode]);
  
  const handleGoToIssue = (lineIndex: number) => {
    setScrollToLineIndex(lineIndex);
    if (activeTab === Tab.Text && textEditorRef.current) {
      textEditorRef.current.scrollToLine(lineIndex);
    }
     // Forcing a reset after a short delay to allow re-triggering for the same index
    setTimeout(() => setScrollToLineIndex(null), 50);
  };

  const handleFixIssue = (lineId: string, issueType: IssueType) => {
    const newLines = applyFix(lines, lineId, issueType);
    setLines(newLines);
  };
  
  const handleFixAll = (issueType: IssueType) => {
    const newLines = applyFixAll(lines, issueType);
    setLines(newLines);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Audio:
        return <AudioUpload onAudioUpload={handleAudioUpload} audioFileName={audioFileName} onNoAudio={handleNoAudio} />;
      case Tab.Text:
        return <TextEditor 
                  ref={textEditorRef}
                  text={textForEditor} 
                  onTextChange={handleTextChange}
                  onLinesUpload={handleLinesUpload}
                  onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)}
                />;
      case Tab.Sync:
        return <Synchronizer 
                  lines={lines} 
                  setLines={setLines} 
                  audioRef={audioRef}
                  onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)}
                  scrollToLineIndex={scrollToLineIndex}
                />;
      case Tab.Result:
        return <ResultView lines={lines} audioDuration={audioDuration} audioFileName={audioFileName} noAudioMode={noAudioMode} />;
      case Tab.Player:
        return <PlayerView lines={lines} audioRef={audioRef} />;
      case Tab.Admin:
        return <AdminView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* FIX: Update header to show user info and logout button if available. */}
      <header className="py-4 px-6 bg-slate-800/70 backdrop-blur-sm border-b border-slate-700/50 shadow-md flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Zion Distribution</h1>
          <p className="text-slate-400 text-sm">Построчный редактор и синхронизатор субтитров</p>
        </div>
        {user && onLogout && (
          <div className="flex items-center gap-4">
            {user.email && <span className="text-sm text-slate-300 hidden sm:inline">{user.email}</span>}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Выйти
            </button>
          </div>
        )}
      </header>


      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex justify-between items-center">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} isTabDisabled={isTabDisabled} />
             <div className="px-6">
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 bg-red-600/80 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    Сброс
                </button>
            </div>
        </div>
        
        {showDraftNotice && (
            <div className="mx-6 md:mx-8 mt-4 p-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 rounded-lg flex justify-between items-center">
                <p className="text-sm">Загружен черновик. Вам потребуется заново выбрать аудиофайл: <strong className="font-mono">{draftAudioName}</strong></p>
                <button onClick={() => { setShowDraftNotice(false); handleReset(); }} className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-md text-xs">Начать заново</button>
            </div>
        )}

        <div className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="h-full flex gap-6">
              <div className="flex-grow h-full min-w-0">
                {renderContent()}
              </div>
              {isFormattingHelperOpen && (activeTab === Tab.Text || activeTab === Tab.Sync) && (
                <FormattingHelper
                  lines={lines}
                  onClose={() => setIsFormattingHelperOpen(false)}
                  onGoToIssue={handleGoToIssue}
                  onFixIssue={handleFixIssue}
                  onFixAll={handleFixAll}
                  onTextChange={handleTextChange}
                />
              )}
            </div>
        </div>
      </main>

      {audioUrl && (
        <AudioPlayer 
          src={audioUrl} 
          audioRef={audioRef} 
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
        />
      )}
      
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirm={handleConfirmReset}
          title="Подтверждение сброса"
          confirmText="Да, сбросить"
          cancelText="Отмена"
        >
          <p className="text-base leading-relaxed">
            Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя будет отменить.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default App;