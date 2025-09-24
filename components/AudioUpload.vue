<template>
  <div class="h-full flex flex-col items-center justify-center text-center bg-black/20 rounded-lg p-8">
    <div v-if="audioFileName">
      <h2 class="text-xl font-semibold mb-4 text-white">
        {{ isFileUploaded ? "Загружен файл:" : "Загрузите файл:" }} <span class="text-[#FF553E] font-medium break-all">{{ audioFileName }}</span>
      </h2>
      <button
        @click="fileInputRef?.click()"
        class="px-6 py-3 bg-[#FF553E] text-white font-semibold rounded-lg hover:bg-[#ff7b6b] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]"
      >
        {{ isFileUploaded ? "Изменить аудиофайл" : "Загрузить" }}
      </button>
    </div>
    <div v-else>
      <h2 class="text-xl font-semibold mb-4 text-white">Шаг 1: Загрузите аудиофайл</h2>
      <p class="text-gray-300 mb-8 max-w-md">Выберите или перетащите аудиофайл (MP3, WAV, OGG), который вы хотите синхронизировать с текстом. После загрузки вы перейдете к следующему шагу.</p>
      
      <label
        for="audio-file-input"
        @dragover.prevent
        @drop.prevent="onDrop"
        class="flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-black/10 hover:bg-black/20 transition-colors"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon />
          <p class="mb-2 text-sm text-gray-300"><span class="font-semibold text-[#FF553E]">Нажмите для загрузки</span> или перетащите файл</p>
          <p class="text-xs text-gray-400">MP3, WAV, OGG, FLAC</p>
        </div>
      </label>
      <div class="my-6 flex items-center w-full max-w-lg">
        <div class="flex-grow border-t border-white/10"></div>
        <span class="flex-shrink mx-4 text-gray-300 text-sm">ИЛИ</span>
        <div class="flex-grow border-t border-white/10"></div>
      </div>
      <button
        @click="$emit('noAudio')"
        class="px-6 py-3 bg-black/20 text-white font-semibold rounded-lg hover:bg-black/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]"
      >
        Продолжить без аудио
      </button>
    </div>
    <input 
      id="audio-file-input" 
      ref="fileInputRef"
      type="file" 
      accept="audio/*" 
      class="hidden" 
      @change="handleFileChange" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UploadIcon from './icons/UploadIcon.vue';

interface Props {
  audioFileName: string | null;
  isFileUploaded: boolean;
}

defineProps<Props>();
const emit = defineEmits<{'audioUpload': [file: File], 'noAudio': []}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('audioUpload', file);
  }
  if (target) {
    target.value = '';
  }
};

const onDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('audio/')) {
    emit('audioUpload', file);
  }
};
</script>
