<template>
  <footer class="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 px-4 py-3 shadow-lg flex-shrink-0">
    <audio
      ref="audioRef"
      :src="src"
      @loadedmetadata="handleLoadedMetadata"
      @play="setIsPlaying(true)"
      @pause="setIsPlaying(false)"
      @ended="setIsPlaying(false)"
    />
    <div class="w-full flex items-center gap-4">
      <button
        @click="togglePlayPause"
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
        @mousedown="isSeeking = true"
        @mouseup="isSeeking = false"
        @touchstart="isSeeking = true"
        @touchend="isSeeking = false"
        class="w-full custom-range"
      />
      <span class="text-sm font-mono text-slate-400 tabular-nums">{{ formatTime(duration) }}</span>

      <div class="flex items-center gap-1.5 bg-slate-700/50 p-1 rounded-lg">
        <button @click="handlePlaybackRateChange(0.75)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 0.75, 'hover:bg-slate-600 text-slate-300': playbackRate !== 0.75 }]">0.75x</button>
        <button @click="handlePlaybackRateChange(1)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 1, 'hover:bg-slate-600 text-slate-300': playbackRate !== 1 }]">1x</button>
        <button @click="handlePlaybackRateChange(1.25)" :class="['px-2 py-0.5 text-xs font-mono rounded-md transition-colors', { 'bg-sky-500 text-white': playbackRate === 1.25, 'hover:bg-slate-600 text-slate-300': playbackRate !== 1.25 }]">1.25x</button>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import PlayIcon from './icons/PlayIcon.vue';
import PauseIcon from './icons/PauseIcon.vue';

const props = defineProps({
  src: String,
  audioRef: HTMLAudioElement
});

const emit = defineEmits(['loadedmetadata']);

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const playbackRate = ref(1);
const progressRef = ref(null);
const isSeeking = ref(false);
let animationFrameId = null;

const formatTime = (time) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const updateProgress = () => {
  if (props.audioRef && progressRef.value) {
    if (!isSeeking.value) {
      progressRef.value.value = props.audioRef.currentTime;
    }
    if (duration.value > 0) {
      const progress = (Number(progressRef.value.value) / duration.value) * 100;
      progressRef.value.style.setProperty('--seek-before-width', `${progress}%`);
    }
  }
  animationFrameId = requestAnimationFrame(updateProgress);
};

onMounted(() => {
  const audio = props.audioRef;
  if (!audio) return;

  const handleTimeUpdate = () => {
    if (!isSeeking.value) {
      currentTime.value = audio.currentTime;
    }
  };
  audio.addEventListener('timeupdate', handleTimeUpdate);

  const startAnimation = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateProgress);
  };
  const stopAnimation = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  audio.addEventListener('play', startAnimation);
  audio.addEventListener('playing', startAnimation);
  audio.addEventListener('pause', stopAnimation);
  audio.addEventListener('ended', stopAnimation);

  const handleKeyDown = (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      togglePlayPause();
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  onBeforeUnmount(() => {
    stopAnimation();
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('play', startAnimation);
    audio.removeEventListener('playing', startAnimation);
    audio.removeEventListener('pause', stopAnimation);
    audio.removeEventListener('ended', stopAnimation);
    window.removeEventListener('keydown', handleKeyDown);
  });
});

const togglePlayPause = () => {
  if (props.audioRef) {
    if (isPlaying.value) {
      props.audioRef.pause();
    } else {
      props.audioRef.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

const handlePlaybackRateChange = (rate) => {
  if (props.audioRef) {
    props.audioRef.playbackRate = rate;
    playbackRate.value = rate;
  }
};

const handleLoadedMetadata = (e) => {
  if (props.audioRef) {
    duration.value = props.audioRef.duration;
  }
  emit('loadedmetadata', e);
};

const handleSeekInput = (e) => {
  const newTime = Number(e.target.value);
  currentTime.value = newTime;
  if (props.audioRef) {
    props.audioRef.currentTime = newTime;
  }
};

const setIsPlaying = (playing) => {
  isPlaying.value = playing;
};
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