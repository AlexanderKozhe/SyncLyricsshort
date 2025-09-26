<template>
  <footer class="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 shadow-lg flex-shrink-0">
    <div class="w-full flex items-center gap-4">
      <button
        @click="$emit('toggle-play-pause')"
        class="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-lg shadow-sky-500/20"
      >
        <PauseIcon v-if="isPlaying" />
        <PlayIcon v-else />
      </button>
      <span class="text-sm font-mono text-slate-400 tabular-nums">{{ formatTime(currentTime) }}</span>
      <input
        ref="progressRef"
        type="range"
        min="0"
        :max="duration || 0"
        :value="currentTime"
        @input="handleSeekInput"
        class="w-full custom-range"
      />
      <span class="text-sm font-mono text-slate-400 tabular-nums">{{ formatTime(duration) }}</span>

      <div class="flex items-center gap-1.5 bg-slate-700/50 p-1 rounded-lg">
        <button @click="$emit('playback-rate-change', 0.75)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 0.75, 'hover:bg-slate-600 text-slate-300': playbackRate !== 0.75 }]">0.75x</button>
        <button @click="$emit('playback-rate-change', 1)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 1, 'hover:bg-slate-600 text-slate-300': playbackRate !== 1 }]">1x</button>
        <button @click="$emit('playback-rate-change', 1.25)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 1.25, 'hover:bg-slate-600 text-slate-300': playbackRate !== 1.25 }]">1.25x</button>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, watch } from 'vue';
import PlayIcon from './icons/PlayIcon.vue';
import PauseIcon from './icons/PauseIcon.vue';

const props = defineProps({
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  playbackRate: Number
});

const emit = defineEmits(['toggle-play-pause', 'seek', 'playback-rate-change']);

const progressRef = ref(null);

const formatTime = (time) => {
  if (isNaN(time) || time === Infinity) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const handleSeekInput = (e) => {
  emit('seek', Number(e.target.value));
};

const updateProgressStyle = () => {
  if (progressRef.value && props.duration > 0) {
    const progress = (props.currentTime / props.duration) * 100;
    progressRef.value.style.setProperty('--seek-before-width', `${progress || 0}%`);
  } else if (progressRef.value) {
    progressRef.value.style.setProperty('--seek-before-width', '0%');
  }
}

watch(() => props.currentTime, updateProgressStyle);
watch(() => props.duration, updateProgressStyle);

</script>

<style>
.custom-range {
  -webkit-appearance: none;
  @apply w-full h-2 bg-slate-700 rounded-full outline-none;
}

.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  @apply w-4 h-4 bg-sky-500 rounded-full cursor-pointer;
  box-shadow: 0 0 5px rgba(3, 105, 161, 0.5);
}

.custom-range {
  position: relative;
  background: #334155;
}

.custom-range::before {
  content: '';
  height: 8px;
  width: var(--seek-before-width, 0%);
  background-color: #0ea5e9;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: 9999px;
}

.custom-range::-webkit-slider-thumb {
    position: relative;
    z-index: 1;
}

.custom-range::-moz-range-thumb {
    position: relative;
    z-index: 1;
}
</style>