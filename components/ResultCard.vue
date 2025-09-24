<template>
  <div>
    <div class="bg-black/20 rounded-lg flex flex-col h-full shadow-lg">
      <div class="flex justify-between items-center p-4 border-b border-white/10">
        <h3 class="text-lg font-semibold text-[#FF553E]">{{ title }}</h3>
        <div class="flex gap-2">
            <button @click="handleCopy" :disabled="isLocked" class="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Копировать">
                <CopyIcon :copied="copied" />
            </button>
            <button @click="handleDownload" :disabled="isLocked" class="p-2 rounded-md bg-black/30 hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Скачать">
                <DownloadIcon />
            </button>
        </div>
      </div>
      <div v-if="isLocked" class="flex-grow flex items-center justify-center flex-col text-center p-4 text-gray-400">
        <LockIcon />
        <span class="mt-2 text-sm font-medium">Не синхронизировано</span>
      </div>
      <textarea
        v-else
        readonly
        :value="data"
        class="flex-grow p-4 text-sm font-mono bg-black/40 rounded-b-lg resize-none border-none focus:ring-0 custom-scrollbar text-gray-200 whitespace-pre"
      />
    </div>
    <FileNameModal
      v-if="!isLocked"
      :is-open="isNameModalOpen"
      @close="isNameModalOpen = false"
      @confirm="handleConfirmName"
      :file-extension="fileExtension"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CopyIcon from './icons/CopyIcon.vue';
import DownloadIcon from './icons/DownloadIcon.vue';
import LockIcon from './icons/LockIcon.vue';
import FileNameModal from './FileNameModal.vue';

const props = defineProps({
  title: String,
  data: String,
  fileExtension: String,
  audioFileName: String,
  isLocked: Boolean,
});

const copied = ref(false);
const isNameModalOpen = ref(false);

const handleCopy = () => {
  if (props.isLocked) return;
  navigator.clipboard.writeText(props.data);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const handleDownload = () => {
  if (props.isLocked) return;
  if (props.audioFileName) {
    const baseFileName = props.audioFileName.replace(/\.[^/.]+$/, "");
    downloadFile(props.data, `${baseFileName}.${props.fileExtension}`);
  } else {
    isNameModalOpen.value = true;
  }
};

const handleConfirmName = (name) => {
  downloadFile(props.data, `${name}.${props.fileExtension}`);
  isNameModalOpen.value = false;
};
</script>
