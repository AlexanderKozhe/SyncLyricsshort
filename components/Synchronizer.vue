<template>
  <div class="h-full flex flex-col bg-slate-800 rounded-lg overflow-hidden relative">
    <div class="p-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-slate-200">Шаг 3: Синхронизация</h2>
        <p class="text-sm text-slate-400 mt-1">
          Используйте <span class="font-mono bg-slate-700 px-1.5 py-0.5 rounded-md text-sky-400 mx-1">Enter</span> для синхронизации,
          <span class="font-mono bg-slate-700 px-1.5 py-0.5 rounded-md text-sky-400 mx-1">↑ ↓</span> для навигации.
        </p>
      </div>
      <div class="flex items-center gap-4">
        <button
          @click="handleResetAll"
          class="flex items-center gap-2 whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium transition-all duration-300 ease-in-out bg-slate-700 text-slate-300 hover:bg-red-600 hover:text-white"
          title="Сбросить всю синхронизацию"
        >
          <ResetIcon />
          <span>Сбросить все</span>
        </button>
        <button
          @click="$emit('toggleHelper')"
          class="flex items-center gap-2 whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium transition-all duration-300 ease-in-out bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
          title="Помощник по форматированию"
        >
          <SparklesIcon />
          <span>Помощник</span>
        </button>
      </div>
    </div>
    <div class="flex-grow overflow-y-auto custom-scrollbar p-2 pb-24">
      <div class="space-y-2">
        <div v-for="(line, index) in lines" :key="line.id" :ref="el => { if (index === activeIndex) activeLineRef = el as HTMLDivElement }" @click="handleLineClick(index)"
          :class="['flex items-center gap-3 p-3 rounded-md transition-all duration-200 cursor-pointer',
            index === activeIndex ? 'bg-sky-500/20 ring-2 ring-sky-500' : 'bg-slate-700/50 hover:bg-slate-700',
            line.text.trim() === '' && index !== activeIndex ? 'opacity-60' : ''
          ]">
          <div 
            @click.stop="handleLineClick(index)"
            class="text-sm font-mono text-slate-400 w-8 text-center flex-shrink-0 hover:text-sky-400 transition-colors"
            title="Воспроизвести отрезок"
            >
            {{ index + 1 }}
          </div>
          <input type="text" :value="line.text" 
            @input="handleLineTextChange(line.id, ($event.target as HTMLInputElement).value)"
            @keydown="handleLineKeyDown($event, index)"
            @click.stop
            class="flex-grow bg-transparent focus:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-sky-600 rounded px-2 py-1 -my-1"/>
          <div class="flex items-center gap-3">
            <button 
              @click.stop="handleResetLine(index)"
              :disabled="line.begin === null && line.end === null"
              class="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Сбросить время для этой строки"
            >
              <ResetIcon class="w-5 h-5" />
            </button>
            <div class="text-center">
              <span class="text-xs text-slate-400">Начало</span>
              <div class="flex items-center gap-1 font-mono text-sm">
                <button @click.stop="adjustTime(index, 'begin', -0.1)" :disabled="line.begin === null || line.text.trim() === ''" class="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&lt;</button>
                <button @click.stop="handleLineClick(index)" class="text-sky-400 w-20 text-center tabular-nums rounded hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="line.begin === null || line.text.trim() === ''" title="Воспроизвести отрезок">{{ formatTime(line.begin) }}</button>
                <button @click.stop="adjustTime(index, 'begin', 0.1)" :disabled="line.begin === null || line.text.trim() === ''" class="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&gt;</button>
              </div>
            </div>
            <div class="text-center">
              <span class="text-xs text-slate-400">Конец</span>
              <div class="flex items-center gap-1 font-mono text-sm">
                <button @click.stop="adjustTime(index, 'end', -0.1)" :disabled="line.end === null || line.text.trim() === ''" class="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&lt;</button>
                <button @click.stop="handlePlayFromEnd(index)" class="text-green-400 w-20 text-center tabular-nums rounded hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="line.end === null || line.text.trim() === ''" title="Воспроизвести с конца строки">{{ formatTime(line.end) }}</button>
                <button @click.stop="adjustTime(index, 'end', 0.1)" :disabled="line.end === null || line.text.trim() === ''" class="px-1.5 rounded bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">&gt;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 right-0 p-4 bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 flex justify-center items-center">
      <button @click="handleSyncAction" :disabled="!lines[activeIndex] || lines[activeIndex].text.trim() === ''"
        :class="['flex items-center justify-center gap-3 w-48 h-14 rounded-xl text-lg font-semibold shadow-lg transform transition-all hover:scale-105 focus:outline-none focus:ring-4',
          syncMode === 'begin' ? 'bg-slate-200 text-slate-900 focus:ring-slate-400' : 'bg-sky-500 text-white focus:ring-sky-300',
          'disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none'
        ]">
        <component :is="syncMode === 'begin' ? ChevronUpIcon : ChevronDownIcon" />
        <span>{{ syncMode === 'begin' ? 'Начало строки' : 'Конец строки' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { SyncedLine } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon.vue';
import ChevronDownIcon from './icons/ChevronDownIcon.vue';
import SparklesIcon from './icons/SparklesIcon.vue';
import ResetIcon from './icons/ResetIcon.vue';

const props = defineProps<{
  lines: SyncedLine[];
  audioRef: HTMLAudioElement | null;
  scrollToLineIndex: number | null;
  activeIndex: number;
}>();

const emit = defineEmits<{'update:lines': [lines: SyncedLine[]], 'update:activeIndex': [index: number], 'toggleHelper': []}>();

const activeLineRef = ref<HTMLDivElement | null>(null);
const focusIndex = ref<number | null>(null);
const cursorPosition = ref<number | null>(null);
const stopPlaybackAt = ref<number | null>(null);

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

const playSegment = (startTime: number | null, endTime: number | null = null) => {
  if (props.audioRef && startTime !== null) {
    stopPlaybackAt.value = endTime;
    props.audioRef.currentTime = startTime;
    props.audioRef.play().catch(e => console.error("Audio playback failed:", e));
  }
};

const timeUpdateHandler = () => {
  if (props.audioRef && stopPlaybackAt.value !== null && props.audioRef.currentTime >= stopPlaybackAt.value) {
    props.audioRef.pause();
    stopPlaybackAt.value = null;
  }
};

const pauseHandler = () => {
  stopPlaybackAt.value = null;
}

onMounted(() => {
  if (props.audioRef) {
    props.audioRef.addEventListener('timeupdate', timeUpdateHandler);
    props.audioRef.addEventListener('pause', pauseHandler);
  }
  document.addEventListener('keydown', handleGlobalKeyDown);
});

onBeforeUnmount(() => {
  if (props.audioRef) {
    props.audioRef.removeEventListener('timeupdate', timeUpdateHandler);
    props.audioRef.removeEventListener('pause', pauseHandler);
  }
  document.removeEventListener('keydown', handleGlobalKeyDown);
});

watch(() => props.scrollToLineIndex, (newVal) => {
  if (newVal !== null) {
    emit('update:activeIndex', newVal);
  }
});

watch(() => props.activeIndex, () => {
  nextTick(() => {
    activeLineRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

watch(focusIndex, () => {
  if (focusIndex.value !== null && activeLineRef.value) {
    const input = activeLineRef.value.querySelector('input');
    if (input) {
      input.focus();
      if (cursorPosition.value !== null) {
        input.setSelectionRange(cursorPosition.value, cursorPosition.value);
        cursorPosition.value = null;
      }
    }
    focusIndex.value = null;
  }
});

const handleSyncAction = () => {
  if (!props.audioRef) return;
  const currentTime = props.audioRef.currentTime;
  const currentLine = props.lines[props.activeIndex];

  if (!currentLine || currentLine.text.trim() === '') return;

  const syncMode = (currentLine.text.trim() !== '' && currentLine.begin !== null && currentLine.end === null) ? 'end' : 'begin';

  if (syncMode === 'begin') {
    const newLines = props.lines.map((line, index) =>
      index === props.activeIndex ? { ...line, begin: currentTime, end: null } : line
    );
    emit('update:lines', newLines);
  } else { // syncMode === 'end'
    const newLines = props.lines.map((line, index) => {
      if (index === props.activeIndex) {
        return (line.begin !== null && currentTime > line.begin)
          ? { ...line, end: currentTime }
          : line;
      }
      return line;
    });
    emit('update:lines', newLines);
    
    const nextNonEmptyIndex = props.lines.findIndex((line, index) => index > props.activeIndex && line.text.trim() !== '');
    if (nextNonEmptyIndex !== -1) {
      emit('update:activeIndex', nextNonEmptyIndex);
    }
  }
};

const findPrevTimestampedLine = (startIndex: number): SyncedLine | null => {
  for (let i = startIndex - 1; i >= 0; i--) {
    if (props.lines[i] && props.lines[i].end !== null) {
      return props.lines[i];
    }
  }
  return null;
};

const findNextTimestampedLine = (startIndex: number): SyncedLine | null => {
  for (let i = startIndex + 1; i < props.lines.length; i++) {
    if (props.lines[i] && props.lines[i].begin !== null) {
      return props.lines[i];
    }
  }
  return null;
};

const adjustTime = (index: number, type: 'begin' | 'end', amount: number) => {
  emit('update:activeIndex', index);
  const line = props.lines[index];
  const originalTime = line[type];
  if (originalTime === null) return;

  let newTime = originalTime + amount;
  newTime = Math.max(0, newTime);

  if (type === 'begin' && line.end !== null) {
    newTime = Math.min(newTime, line.end - 0.1);
  } else if (type === 'end' && line.begin !== null) {
    newTime = Math.max(newTime, line.begin + 0.1);
  }

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
    const newLines = props.lines.map((l, i) =>
      i === index ? { ...l, [type]: finalNewTime } : l
    );
    emit('update:lines', newLines);
  }
  
  const playbackStartTime = finalNewTime;
  let playbackEndTime: number | null = null;
  
  if (type === 'begin') {
    const currentEnd = line.end;
    playbackEndTime = currentEnd !== null && playbackStartTime < currentEnd ? currentEnd : null;
  } else { // 'end'
    const nextLine = findNextTimestampedLine(index);
    if (nextLine && nextLine.begin !== null) {
      playbackEndTime = nextLine.begin;
    } else if (props.audioRef) {
      playbackEndTime = props.audioRef.duration;
    }
  }

  playSegment(playbackStartTime, playbackEndTime);
};

const handleLineClick = (index: number) => {
  emit('update:activeIndex', index);
  const line = props.lines[index];
  playSegment(line.begin, line.end);
};

const handlePlayFromEnd = (index: number) => {
  emit('update:activeIndex', index);
  const line = props.lines[index];
  if (line.end === null) return;

  const nextLine = findNextTimestampedLine(index);
  let stopTime: number | null = null;
  if (nextLine && nextLine.begin !== null) {
    stopTime = nextLine.begin;
  } else if (props.audioRef) {
    stopTime = props.audioRef.duration;
  }
  
  playSegment(line.end, stopTime);
};

const handleLineTextChange = (id: string, newText: string) => {
  const newLines = props.lines.map(line => (line.id === id ? { ...line, text: newText } : line));
  emit('update:lines', newLines);
};

const handleLineKeyDown = (e: KeyboardEvent, index: number) => {
  const line = props.lines[index];
  const target = e.target as HTMLInputElement;

  if (e.key === 'Enter') {
    e.preventDefault();
    const cursorPositionVal = target.selectionStart ?? line.text.length;
    const textBefore = line.text.substring(0, cursorPositionVal);
    const textAfter = line.text.substring(cursorPositionVal);

    const newLines = [...props.lines];
    newLines[index] = { ...newLines[index], text: textBefore };
    const newLine: SyncedLine = {
      id: `${Date.now()}-${index + 1}`,
      text: textAfter,
      begin: null,
      end: null,
    };
    newLines.splice(index + 1, 0, newLine);
    emit('update:lines', newLines);

    emit('update:activeIndex', index + 1);
    focusIndex.value = index + 1;
    cursorPosition.value = 0;
  } else if (e.key === 'Backspace' && target.selectionStart === 0 && target.selectionEnd === 0 && index > 0) {
    e.preventDefault();
    const prevIndex = index - 1;
    const prevLine = props.lines[prevIndex];
    const newCursorPos = prevLine.text.length;

    const newLines = [...props.lines];
    const currentLine = newLines[index];
    newLines[prevIndex] = { ...newLines[prevIndex], text: newLines[prevIndex].text + currentLine.text };
    newLines.splice(index, 1);
    emit('update:lines', newLines);
    
    emit('update:activeIndex', prevIndex);
    focusIndex.value = prevIndex;
    cursorPosition.value = newCursorPos;
  }
};

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.code === 'Enter') { e.preventDefault(); handleSyncAction(); }
  if (e.code === 'ArrowUp') { 
    e.preventDefault(); 
    if (props.activeIndex > 0) {
      emit('update:activeIndex', props.activeIndex - 1);
    }
  }
  if (e.code === 'ArrowDown') { 
    e.preventDefault(); 
    if (props.activeIndex < props.lines.length - 1) {
      emit('update:activeIndex', props.activeIndex + 1);
    }
  }
};

const handleResetAll = () => {
  if (window.confirm('Вы уверены, что хотите сбросить всю синхронизацию? Это действие необратимо.')) {
    const newLines = props.lines.map(line => ({ ...line, begin: null, end: null }));
    emit('update:lines', newLines);
    emit('update:activeIndex', 0);
  }
};

const handleResetLine = (index: number) => {
  const newLines = props.lines.map((line, i) =>
    i === index ? { ...line, begin: null, end: null } : line
  );
  emit('update:lines', newLines);
};

const syncMode = computed(() => {
  const currentLine = props.lines[props.activeIndex];
  return (currentLine?.text.trim() !== '' && currentLine?.begin !== null && currentLine?.end === null) ? 'end' : 'begin';
});

</script>
