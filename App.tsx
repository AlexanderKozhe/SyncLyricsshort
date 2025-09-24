
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Tab, SyncedLine, IssueType, User, Role } from './types';
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
import ProfilePage from './components/ProfilePage';
import ProfileDropdown from './components/ProfileDropdown';
import ZionLogo from './components/icons/ZionLogo';
import DraftModal from './components/DraftModal';

const DRAFT_KEY = 'zion_sync_draft';

interface DraftData {
  lines: SyncedLine[];
  audioFileName: string | null;
  timestamp: number;
}

interface AppProps {
  userProfile: User;
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ userProfile: initialProfile, onLogout }) => {
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Audio);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [lines, setLines] = useState<SyncedLine[]>([]);
  const [isFormattingHelperOpen, setIsFormattingHelperOpen] = useState(false);
  const [scrollToLineIndex, setScrollToLineIndex] = useState<number | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [noAudioMode, setNoAudioMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftData, setDraftData] = useState<DraftData | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textEditorRef = useRef<{ scrollToLine: (index: number) => void }>(null);

  useEffect(() => {
    setUserProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (activeIndex >= lines.length && lines.length > 0) {
      setActiveIndex(lines.length - 1);
    } else if (lines.length === 0) {
      setActiveIndex(0);
    }
  }, [lines, activeIndex]);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsedDraft: DraftData = JSON.parse(savedDraft);
        const hasTextContent = parsedDraft.lines.some(line => line.text.trim() !== '');
        if (parsedDraft.timestamp && hasTextContent) {
          setDraftData(parsedDraft);
          setIsDraftModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (lines.length > 0 || audioFileName) {
        const draft: DraftData = { lines, audioFileName, timestamp: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  }, [lines, audioFileName]);

  const textForEditor = useMemo(() => lines.map(line => line.text).join('\n'), [lines]);
  const allLinesSynced = useMemo(() => lines.length > 0 && lines.every(line => line.text.trim() === '' || (line.begin !== null && line.end !== null)), [lines]);

  const isTabDisabled = useCallback((tab: Tab) => {
    if (tab === Tab.Audio) return false;
    if (tab === Tab.Admin) return userProfile?.role !== Role.Admin;
    if (tab === Tab.Profile) return !userProfile;
    const hasSource = !!audioUrl || (draftData !== null) || noAudioMode;
    if (!hasSource) return true;
    const hasTextContent = lines.some(l => l.text.trim() !== '');
    if (!hasTextContent && (tab === Tab.Sync || tab === Tab.Result || tab === Tab.Player)) return true;
    if ((tab === Tab.Sync || tab === Tab.Player) && (noAudioMode || !audioUrl)) return true;
    if (tab === Tab.Player && !allLinesSynced) return true;
    return false;
  }, [audioUrl, lines, draftData, allLinesSynced, noAudioMode, userProfile]);

  const handleProfileUpdate = async (updatedProfileData: Partial<Omit<User, 'uid' | 'email' | 'role'>>) => {
    const newProfile = { ...userProfile, ...updatedProfileData };
    setUserProfile(newProfile);
    try {
      const userDocRef = doc(db, 'users', userProfile.uid);
      await setDoc(userDocRef, updatedProfileData, { merge: true });
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      setUserProfile(initialProfile); 
      alert('Не удалось сохранить изменения. Попробуйте перезагрузить страницу.');
    }
  };

  const handleAudioUpload = (file: File) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioFileName(file.name);
    setIsFileUploaded(true);
    setNoAudioMode(false);
    setActiveTab(Tab.Text);
  };
  
  const handleNoAudio = () => { setAudioUrl(null); setAudioFileName(null); setAudioDuration(0); setNoAudioMode(true); setActiveTab(Tab.Text); setIsFileUploaded(false); };
  const handleReset = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); } if (audioUrl) { URL.revokeObjectURL(audioUrl); } setAudioUrl(null); setAudioFileName(null); setLines([]); setAudioDuration(0); setActiveTab(Tab.Audio); setIsFormattingHelperOpen(false); setNoAudioMode(false); setActiveIndex(0); setIsFileUploaded(false); setDraftData(null); localStorage.removeItem(DRAFT_KEY); };
  const handleConfirmReset = () => { handleReset(); setIsResetModalOpen(false); };
  
  const handleTextChange = (newText: string) => {
    const newTextLines = newText.split('\n');
    const oldLinesMap = new Map<string, SyncedLine[]>();
    for (const line of lines) {
        const trimmedText = line.text.trim();
        if (trimmedText !== '') {
            if (!oldLinesMap.has(trimmedText)) {
                oldLinesMap.set(trimmedText, []);
            }
            oldLinesMap.get(trimmedText)!.push(line);
        }
    }
    const newSyncedLines: SyncedLine[] = newTextLines.map((text, index) => {
        const trimmedText = text.trim();
        if (trimmedText === '') {
            return { id: `${Date.now()}-${index}`, text: '', begin: null, end: null };
        }
        const potentialMatches = oldLinesMap.get(trimmedText);
        if (potentialMatches && potentialMatches.length > 0) {
            const matchedLine = potentialMatches.shift()!;
            return { ...matchedLine, text: text };
        }
        return { id: `${Date.now()}-${index}`, text: text, begin: null, end: null };
    });
    setLines(newSyncedLines);
  };

  const handleRestoreDraft = () => {
    if (draftData) {
      setLines(draftData.lines);
      setAudioFileName(draftData.audioFileName);
      if (!draftData.audioFileName) {
        setActiveTab(Tab.Text);
        setNoAudioMode(true);
      }
    }
    setIsDraftModalOpen(false);
  };

  const handleResetDraft = () => {
    handleReset();
    setIsDraftModalOpen(false);
  };

  const handleLinesUpload = (newLines: SyncedLine[]) => { setLines(newLines); setActiveTab(Tab.Sync); };
  const handleGoToIssue = (lineIndex: number) => { setActiveIndex(lineIndex); setScrollToLineIndex(lineIndex); if (activeTab === Tab.Text && textEditorRef.current) { textEditorRef.current.scrollToLine(lineIndex); } setTimeout(() => setScrollToLineIndex(null), 50); };
  const handleFixIssue = (lineId: string, issueType: IssueType) => setLines(applyFix(lines, lineId, issueType));
  const handleFixAll = (issueType: IssueType) => setLines(applyFixAll(lines, issueType));
  const handleProfileClick = () => setActiveTab(Tab.Profile);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Audio: return <AudioUpload onAudioUpload={handleAudioUpload} audioFileName={audioFileName} onNoAudio={handleNoAudio} isFileUploaded={isFileUploaded} />;
      case Tab.Text: return <TextEditor ref={textEditorRef} text={textForEditor} onTextChange={handleTextChange} onLinesUpload={handleLinesUpload} onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)} />;
      case Tab.Sync: return <Synchronizer lines={lines} setLines={setLines} audioRef={audioRef} onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)} scrollToLineIndex={scrollToLineIndex} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />;
      case Tab.Result: return <ResultView lines={lines} audioDuration={audioDuration} audioFileName={audioFileName} noAudioMode={noAudioMode} />;
      case Tab.Player: return <PlayerView lines={lines} audioRef={audioRef} />;
      case Tab.Admin: return <AdminView />;
      case Tab.Profile: return <ProfilePage user={userProfile} onUpdate={handleProfileUpdate} />;
      default: return null;
    }
  };

  const draftNoticeMessage = useMemo(() => {
    if (!draftData) return null;
    if (draftData.audioFileName) {
      return <>Загружен черновик с аудиофайлом: <strong className="font-mono">{draftData.audioFileName}</strong></>;
    }
    if (draftData.lines.length > 0) {
        const firstLine = draftData.lines.find(l => l.text.trim())?.text.trim();
        if (firstLine) {
            return <>Загружен черновик с текстом: <strong className="font-mono">{firstLine.substring(0, 50)}...</strong></>;
        }
    }
    return 'Загружен пустой черновик.';
  }, [draftData]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#5B86E5] text-white font-sans overflow-hidden">
      <header className="relative z-10 py-4 px-6 bg-black/20 backdrop-blur-sm border-b border-white/10 shadow-md flex-shrink-0 flex justify-between items-center">
        <div>
          <ZionLogo />
          <p className="text-gray-300 text-sm mt-1">Построчный редактор и синхронизатор субтитров</p>
        </div>
        <ProfileDropdown user={userProfile} onLogout={onLogout} onProfileClick={handleProfileClick} />
      </header>

      <main className="flex-grow flex flex-col overflow-hidden">
        <div className="flex justify-between items-center">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} isTabDisabled={isTabDisabled} isAdmin={userProfile?.role === Role.Admin} />
          <div className="px-6">
            <button onClick={() => setIsResetModalOpen(true)} className="px-4 py-2 bg-[#FF553E] text-white text-sm font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]">
              Сброс
            </button>
          </div>
        </div>
        
        <div className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="h-full flex gap-6">
            <div className="flex-grow h-full min-w-0">
              {renderContent()}
            </div>
            {isFormattingHelperOpen && (activeTab === Tab.Text || activeTab === Tab.Sync) && (
              <FormattingHelper lines={lines} onClose={() => setIsFormattingHelperOpen(false)} onGoToIssue={handleGoToIssue} onFixIssue={handleFixIssue} onFixAll={handleFixAll} onTextChange={handleTextChange} />
            )}
          </div>
        </div>
      </main>

      {audioUrl && <AudioPlayer src={audioUrl} audioRef={audioRef} onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)} />}
      
      <DraftModal 
        isOpen={isDraftModalOpen} 
        onRestore={handleRestoreDraft} 
        onReset={handleResetDraft} 
        message={draftNoticeMessage}
        timestamp={draftData?.timestamp ?? null}
      />

      {isResetModalOpen && (
        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleConfirmReset} title="Подтверждение сброса" confirmText="Да, сбросить" cancelText="Отмена">
          <p className="text-base leading-relaxed">
            Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя будет отменить.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default App;
