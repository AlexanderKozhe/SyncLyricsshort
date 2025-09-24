
<template>
    <div class="h-full flex flex-col bg-black/20 rounded-lg overflow-hidden">
        <div class="p-4 border-b border-white/10 flex-shrink-0">
            <div>
                <h2 class="text-xl font-semibold text-white">Шаг 5: Плеер</h2>
                <p class="text-sm text-gray-300 mt-1">
                    Просмотр синхронизированного текста в реальном времени.
                </p>
            </div>
        </div>
        <div class="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar p-8">
            <div class="text-center space-y-4">
                <p
                    v-for="line in lines"
                    :key="line.id"
                    :ref="el => (line.id === activeLineId) && (activeLineRef = el)"
                    @click="handleLineClick(line)"
                    :class="[
                        'text-lg md:text-xl font-semibold transition-all duration-300 ease-in-out cursor-pointer',
                        'whitespace-pre-wrap break-words',
                        { 'text-[#FF553E] scale-105': line.id === activeLineId },
                        { 'text-gray-500': line.id !== activeLineId && line.end !== null && audioRef && line.end < audioRef.currentTime },
                        { 'text-gray-300 hover:text-white': line.id !== activeLineId && (line.end === null || !audioRef || line.end >= audioRef.currentTime) }
                    ]"
                >
                    {{ line.text }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
    lines: Array,
    audioRef: Object
});

const activeLineId = ref(null);
const activeLineRef = ref(null);
let animationFrameId = null;

const checkActiveLine = () => {
    const audio = props.audioRef;
    if (!audio) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
    }

    const currentTime = audio.currentTime;
    const currentLine = props.lines.find(line =>
        line.begin !== null && line.end !== null &&
        currentTime >= line.begin && currentTime < line.end
    );
    
    const newActiveId = currentLine ? currentLine.id : null;
    
    if (activeLineId.value !== newActiveId) {
        activeLineId.value = newActiveId;
    }

    animationFrameId = requestAnimationFrame(checkActiveLine);
};

onMounted(() => {
    const audio = props.audioRef;
    if (!audio) return;

    const startAnimation = () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(checkActiveLine);
    };
    const stopAnimation = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };

    const handleSeek = () => {
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
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

    onBeforeUnmount(() => {
        stopAnimation();
        audio.removeEventListener('play', startAnimation);
        audio.removeEventListener('playing', startAnimation);
        audio.removeEventListener('pause', stopAnimation);
        audio.removeEventListener('ended', stopAnimation);
        audio.removeEventListener('seeked', handleSeek);
    });
});

watch(activeLineId, () => {
    activeLineRef.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
});

const handleLineClick = (line) => {
    if (props.audioRef && line.begin !== null) {
        props.audioRef.currentTime = line.begin;
        if (props.audioRef.paused) {
            props.audioRef.play().catch(console.error);
        }
    }
};
</script>
