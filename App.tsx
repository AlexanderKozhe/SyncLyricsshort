
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

const DRAFT_KEY = 'zion_sync_draft';

interface AppProps {
  userProfile: User;
  onLogout: () => void;
}

const App: React.FC<AppProps> = ({ userProfile: initialProfile, onLogout }) => {
  const [userProfile, setUserProfile] = useState(initialProfile);
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
  const [activeIndex, setActiveIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textEditorRef = useRef<{ scrollToLine: (index: number) => void }>(null);
  const hasLoadedDraft = useRef(false);

  useEffect(() => {
    setUserProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    // When lines change, if activeIndex is out of bounds, reset it.
    if (activeIndex >= lines.length && lines.length > 0) {
      setActiveIndex(lines.length - 1);
    } else if (lines.length === 0) {
      setActiveIndex(0);
    }
  }, [lines, activeIndex]);

  useEffect(() => {
    if (hasLoadedDraft.current) return;
    hasLoadedDraft.current = true;
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

  const textForEditor = useMemo(() => lines.map(line => line.text).join('\n'), [lines]);
  const allLinesSynced = useMemo(() => lines.length > 0 && lines.every(line => line.text.trim() === '' || (line.begin !== null && line.end !== null)), [lines]);

  const isTabDisabled = useCallback((tab: Tab) => {
    if (tab === Tab.Audio) return false;
    if (tab === Tab.Admin) return userProfile?.role !== Role.Admin;
    if (tab === Tab.Profile) return !userProfile;
    const hasSource = !!audioUrl || showDraftNotice || noAudioMode;
    if (!hasSource) return true;
    const hasText = lines.length > 0;
    if (!hasText && (tab === Tab.Sync || tab === Tab.Result || tab === Tab.Player)) return true;
    if ((tab === Tab.Sync || tab === Tab.Player) && (noAudioMode || !audioUrl)) return true;
    if (tab === Tab.Player && !allLinesSynced) return true;
    return false;
  }, [audioUrl, lines, showDraftNotice, allLinesSynced, noAudioMode, userProfile]);

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
    setNoAudioMode(false);
    setActiveTab(Tab.Text);
    setShowDraftNotice(false);
  };
  
  const handleNoAudio = () => { setAudioUrl(null); setAudioFileName(null); setAudioDuration(0); setNoAudioMode(true); setActiveTab(Tab.Text); setShowDraftNotice(false); };
  const handleReset = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); } if (audioUrl) { URL.revokeObjectURL(audioUrl); } setAudioUrl(null); setAudioFileName(null); setLines([]); setAudioDuration(0); setActiveTab(Tab.Audio); setIsFormattingHelperOpen(false); setShowDraftNotice(false); setNoAudioMode(false); localStorage.removeItem(DRAFT_KEY); setActiveIndex(0); };
  const handleConfirmReset = () => { handleReset(); setIsResetModalOpen(false); };
  
  const handleTextChange = (newText: string) => {
    const newTextLines = newText.split('\n');
    const newSyncedLines: SyncedLine[] = newTextLines.map((text, index) => {
      const oldLine = lines[index];
      return {
        id: oldLine ? oldLine.id : `${Date.now()}-${index}`,
        text: text,
        begin: oldLine ? oldLine.begin : null,
        end: oldLine ? oldLine.end : null,
      };
    });
    setLines(newSyncedLines);
  };

  const handleLinesUpload = (newLines: SyncedLine[]) => { setLines(newLines); setActiveTab(Tab.Sync); };
  const handleGoToIssue = (lineIndex: number) => { setActiveIndex(lineIndex); setScrollToLineIndex(lineIndex); if (activeTab === Tab.Text && textEditorRef.current) { textEditorRef.current.scrollToLine(lineIndex); } setTimeout(() => setScrollToLineIndex(null), 50); };
  const handleFixIssue = (lineId: string, issueType: IssueType) => setLines(applyFix(lines, lineId, issueType));
  const handleFixAll = (issueType: IssueType) => setLines(applyFixAll(lines, issueType));
  const handleProfileClick = () => setActiveTab(Tab.Profile);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Audio: return <AudioUpload onAudioUpload={handleAudioUpload} audioFileName={audioFileName} onNoAudio={handleNoAudio} />;
      case Tab.Text: return <TextEditor ref={textEditorRef} text={textForEditor} onTextChange={handleTextChange} onLinesUpload={handleLinesUpload} onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)} />;
      case Tab.Sync: return <Synchronizer lines={lines} setLines={setLines} audioRef={audioRef} onToggleHelper={() => setIsFormattingHelperOpen(!isFormattingHelperOpen)} scrollToLineIndex={scrollToLineIndex} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />;
      case Tab.Result: return <ResultView lines={lines} audioDuration={audioDuration} audioFileName={audioFileName} noAudioMode={noAudioMode} />;
      case Tab.Player: return <PlayerView lines={lines} audioRef={audioRef} />;
      case Tab.Admin: return <AdminView />;
      case Tab.Profile: return <ProfilePage user={userProfile} onUpdate={handleProfileUpdate} />;
      default: return null;
    }
  };

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
              <FormattingHelper lines={lines} onClose={() => setIsFormattingHelperOpen(false)} onGoToIssue={handleGoToIssue} onFixIssue={handleFixIssue} onFixAll={handleFixAll} onTextChange={handleTextChange} />
            )}
          </div>
        </div>
      </main>

      {audioUrl && <AudioPlayer src={audioUrl} audioRef={audioRef} onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)} />}
      
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
