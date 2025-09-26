<template>
  <div class="h-screen w-screen flex flex-col bg-[#5B86E5] text-white font-sans overflow-hidden">
    <header class="relative z-10 py-4 px-6 bg-black/20 backdrop-blur-sm border-b border-white/10 shadow-md flex-shrink-0 flex justify-between items-center">
      <div>
        <ZionLogo />
        <p class="text-gray-300 text-sm mt-1">Построчный редактор и синхронизатор субтитров</p>
      </div>
    </header>

    <main class="flex-grow flex flex-col overflow-hidden">
      <div class="flex justify-between items-center">
        <Tabs :active-tab="activeTab" @update:activeTab="setActiveTab" :is-tab-disabled="isTabDisabled" :is-admin="false" />
        <div class="px-6">
          <button @click="isResetModalOpen = true" class="px-4 py-2 bg-[#FF553E] text-white text-sm font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]">
            Сброс
          </button>
        </div>
      </div>
      
      <div class="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div class="h-full flex gap-6">
          <div class="flex-grow h-full min-w-0">
            <AudioUpload v-if="activeTab === Tab.Audio" @audio-upload="handleAudioUpload" :audio-file-name="audioFileName" @no-audio="handleNoAudio" :is-file-uploaded="isFileUploaded" />
            <TextEditor v-if="activeTab === Tab.Text" ref="textEditorRef" :text="textForEditor" @text-change="handleTextChange" @lines-upload="handleLinesUpload" @toggle-helper="isFormattingHelperOpen = !isFormattingHelperOpen" />
            <Synchronizer v-if="activeTab === Tab.Sync" :lines="lines" @update:lines="setLines" :audio-ref="audioRef" @toggle-helper="isFormattingHelperOpen = !isFormattingHelperOpen" :scroll-to-line-index="scrollToLineIndex" :active-index="activeIndex" @update:activeIndex="setActiveIndex" />
            <ResultView v-if="activeTab === Tab.Result" :lines="lines" :audio-duration="audioDuration" :audio-file-name="audioFileName" :no-audio-mode="noAudioMode" />
            <PlayerView v-if="activeTab === Tab.Player" :lines="lines" :audio-ref="audioRef" />
          </div>
          <FormattingHelper v-if="isFormattingHelperOpen && (activeTab === Tab.Text || activeTab === Tab.Sync)" :lines="lines" @close="isFormattingHelperOpen = false" @go-to-issue="handleGoToIssue" @fix-issue="handleFixIssue" @fix-all="handleFixAll" />
        </div>
      </div>
    </main>

    <AudioPlayer
      v-if="audioUrl"
      :is-playing="isPlaying"
      :current-time="currentTime"
      :duration="audioDuration"
      :playback-rate="playbackRate"
      @toggle-play-pause="togglePlayPause"
      @seek="handleSeek"
      @playback-rate-change="handlePlaybackRateChange"
    />

    <audio 
      v-if="audioUrl" 
      :src="audioUrl" 
      ref="audioRef"
      @loadedmetadata="handleLoadedMetadata" 
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @timeupdate="handleTimeUpdate"
      @durationchange="audioDuration = audioRef ? audioRef.duration : 0"
    ></audio>
    
    <DraftModal 
      :is-open="isDraftModalOpen" 
      @restore="handleRestoreDraft" 
      @reset="handleResetDraft" 
      :message="draftNoticeMessage"
      :timestamp="draftData?.timestamp ?? null"
    />

    <Modal v-if="isResetModalOpen" :is-open="isResetModalOpen" @close="isResetModalOpen = false" @confirm="handleConfirmReset" title="Подтверждение сброса" confirm-text="Да, сбросить" cancel-text="Отмена">
      <p class="text-base leading-relaxed">
        Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя будет отменить.
      </p>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { Tab, SyncedLine, IssueType } from './types';
import Tabs from './components/Tabs.vue';
import AudioUpload from './components/AudioUpload.vue';
import TextEditor from './components/TextEditor.vue';
import Synchronizer from './components/Synchronizer.vue';
import ResultView from './components/ResultView.vue';
import PlayerView from './components/PlayerView.vue';
import FormattingHelper from './components/FormattingHelper.vue';
import Modal from './components/Modal.vue';
import ZionLogo from './components/icons/ZionLogo.vue';
import DraftModal from './components/DraftModal.vue';
import AudioPlayer from './components/AudioPlayer.vue';
import { applyFix, applyFixAll } from './services/analysis';

const DRAFT_KEY = 'zion_sync_draft';

interface DraftData {
  lines: SyncedLine[];
  audioFileName: string | null;
  timestamp: number;
}

const activeTab = ref<Tab>(Tab.Audio);
const audioUrl = ref<string | null>(null);
const isFileUploaded = ref(false);
const audioFileName = ref<string | null>(null);
const audioDuration = ref<number>(0);
const lines = ref<SyncedLine[]>([]);
const isFormattingHelperOpen = ref(false);
const scrollToLineIndex = ref<number | null>(null);
const isResetModalOpen = ref(false);
const noAudioMode = ref(false);
const activeIndex = ref(0);
const isDraftModalOpen = ref(false);
const draftData = ref<DraftData | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const playbackRate = ref(1);

const audioRef = ref<HTMLAudioElement | null>(null);
const textEditorRef = ref<{ scrollToLine: (index: number) => void } | null>(null);

watch([lines, activeIndex], () => {
  if (activeIndex.value >= lines.value.length && lines.value.length > 0) {
    activeIndex.value = lines.value.length - 1;
  } else if (lines.value.length === 0) {
    activeIndex.value = 0;
  }
});

onMounted(() => {
  try {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      const parsedDraft: DraftData = JSON.parse(savedDraft);
      const hasTextContent = parsedDraft.lines.some(line => line.text.trim() !== '');
      if (parsedDraft.timestamp && hasTextContent) {
        draftData.value = parsedDraft;
        isDraftModalOpen.value = true;
      }
    }
  } catch (error) {
    console.error("Failed to load draft:", error);
  }
});

watch([lines, audioFileName], () => {
  try {
    if (lines.value.length > 0 || audioFileName.value) {
      const draft: DraftData = { lines: lines.value, audioFileName: audioFileName.value, timestamp: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}, { deep: true });

const textForEditor = computed(() => lines.value.map(line => line.text).join('\n'));
const allLinesSynced = computed(() => lines.value.length > 0 && lines.value.every(line => line.text.trim() === '' || (line.begin !== null && line.end !== null)));

const isTabDisabled = (tab: Tab): boolean => {
  if (tab === Tab.Audio) return false;
  const hasSource = !!audioUrl.value || (draftData.value !== null) || noAudioMode.value;
  if (!hasSource) return true;
  const hasTextContent = lines.value.some(l => l.text.trim() !== '');
  if (!hasTextContent && (tab === Tab.Sync || tab === Tab.Result || tab === Tab.Player)) return true;
  if ((tab === Tab.Sync || tab === Tab.Player) && (noAudioMode.value || !audioUrl.value)) return true;
  if (tab === Tab.Player && !allLinesSynced.value) return true;
  return false;
};

const handleAudioUpload = (file: File) => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
  const url = URL.createObjectURL(file);
  audioUrl.value = url;
  audioFileName.value = file.name;
  isFileUploaded.value = true;
  noAudioMode.value = false;
  activeTab.value = Tab.Text;
};

const handleNoAudio = () => {
  audioUrl.value = null;
  audioFileName.value = null;
  audioDuration.value = 0;
  noAudioMode.value = true;
  activeTab.value = Tab.Text;
  isFileUploaded.value = false;
};

const handleReset = () => {
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.removeAttribute('src');
    audioRef.value.load();
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
  audioUrl.value = null;
  audioFileName.value = null;
  lines.value = [];
  audioDuration.value = 0;
  activeTab.value = Tab.Audio;
  isFormattingHelperOpen.value = false;
  noAudioMode.value = false;
  activeIndex.value = 0;
  isFileUploaded.value = false;
  draftData.value = null;
  localStorage.removeItem(DRAFT_KEY);
};

const handleConfirmReset = () => {
  handleReset();
  isResetModalOpen.value = false;
};

const handleTextChange = (newText: string) => {
  const newTextLines = newText.split('\n');
  const oldLinesMap = new Map<string, SyncedLine[]>();
  for (const line of lines.value) {
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
  lines.value = newSyncedLines;
};

const handleRestoreDraft = () => {
  if (draftData.value) {
    lines.value = draftData.value.lines;
    audioFileName.value = draftData.value.audioFileName;
    if (!draftData.value.audioFileName) {
      activeTab.value = Tab.Text;
      noAudioMode.value = true;
    }
  }
  isDraftModalOpen.value = false;
};

const handleResetDraft = () => {
  handleReset();
  isDraftModalOpen.value = false;
};

const handleLinesUpload = (newLines: SyncedLine[]) => {
  lines.value = newLines;
  activeTab.value = Tab.Sync;
};

const handleGoToIssue = async (lineIndex: number) => {
  activeIndex.value = lineIndex;
  scrollToLineIndex.value = lineIndex;
  if (activeTab.value === Tab.Text && textEditorRef.value) {
    textEditorRef.value.scrollToLine(lineIndex);
  }
  await nextTick();
  scrollToLineIndex.value = null;
};

const handleFixIssue = (lineId: string, issueType: IssueType) => {
  lines.value = applyFix(lines.value, lineId, issueType);
};

const handleFixAll = (issueType: IssueType) => {
  lines.value = applyFixAll(lines.value, issueType);
};

const draftNoticeMessage = computed(() => {
  if (!draftData.value) return '';
  if (draftData.value.audioFileName) {
    return `Загружен черновик с аудиофайлом: <strong class="font-mono">${draftData.value.audioFileName}</strong>`;
  }
  if (draftData.value.lines.length > 0) {
    const firstLine = draftData.value.lines.find(l => l.text.trim())?.text.trim();
    if (firstLine) {
      return `Загружен черновик с текстом: <strong class="font-mono">${firstLine.substring(0, 50)}...</strong>`;
    }
  }
  return 'Загружен пустой черновик.';
});

const setActiveTab = (tab: Tab) => {
  activeTab.value = tab;
};

const setLines = (newLines: SyncedLine[]) => {
  lines.value = newLines;
};

const setActiveIndex = (index: number) => {
  activeIndex.value = index;
};

const handleLoadedMetadata = () => {
  if (audioRef.value) {
    audioDuration.value = audioRef.value.duration;
  }
};

const handleTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

const togglePlayPause = () => {
  if (audioRef.value) {
    if (isPlaying.value) {
      audioRef.value.pause();
    } else {
      audioRef.value.play();
    }
  }
};

const handleSeek = (time: number) => {
  if (audioRef.value) {
    audioRef.value.currentTime = time;
  }
};

const handlePlaybackRateChange = (rate: number) => {
  if (audioRef.value) {
    audioRef.value.playbackRate = rate;
    playbackRate.value = rate;
  }
};

</script>

<style>
/* I will keep the global styles in index.html for now */
</style>