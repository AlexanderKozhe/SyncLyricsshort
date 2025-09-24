<template>
  <div v-if="hasText || showPasteArea" class="h-full flex flex-col bg-black/20 rounded-lg">
    <div class="flex justify-between items-center p-6 border-b border-white/10">
      <div>
        <h2 class="text-xl font-semibold text-white">Шаг 2: Напишите и отредактируйте текст</h2>
        <p class="text-gray-300 mt-1">Каждая строка будет отдельным элементом для синхронизации.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
            @click="isResetSourceModalOpen = true"
            class="whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            title="Изменить источник текста"
        >
            Изменить источник
        </button>
        <button
          @click="$emit('toggleHelper')"
          class="flex items-center gap-2 whitespace-nowrap rounded-lg py-2 px-3 text-sm font-medium transition-all duration-300 ease-in-out bg-black/20 text-white hover:bg-black/30"
          title="Помощник по форматированию"
        >
          <SparklesIcon />
          <span>Помощник</span>
        </button>
      </div>
    </div>
    <div class="flex-grow p-6 pt-0">
      <textarea
        ref="textareaRef"
        :value="text"
        @input="$emit('textChange', ($event.target as HTMLTextAreaElement).value)"
        placeholder="Напишите ваш текст здесь.\nКаждая новая строка будет отдельным субтитром."
        class="h-full w-full p-5 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-[#FF553E] focus:border-[#FF553E] resize-none custom-scrollbar text-base"
      />
    </div>
    <Modal 
      :is-open="isResetSourceModalOpen" 
      @close="isResetSourceModalOpen = false" 
      @confirm="handleConfirmReset" 
      title="Изменить источник текста?" 
      confirm-text="Да, изменить"
      cancel-text="Отмена"
    >
      <p class="text-base leading-relaxed">
        Изменение источника текста удалит вашу текущую работу. Вы точно хотите продолжить?
      </p>
    </Modal>
  </div>

  <div v-else class="h-full flex flex-col items-center justify-center text-center bg-black/20 rounded-lg p-8">
    <h2 class="text-xl font-semibold mb-2 text-white">Шаг 2: Добавьте текст</h2>
    <p class="text-gray-300 mb-8 max-w-md">Вы можете загрузить TTML-файл или написать текст вручную.</p>
    
    <label
      for="text-file-input"
      @dragover.prevent
      @drop.prevent="onDrop"
      class="flex flex-col items-center justify-center w-full max-w-lg h-56 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-black/10 hover:bg-black/20 transition-colors"
    >
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadIcon />
        <p class="mb-2 text-sm text-gray-300"><span class="font-semibold text-[#FF553E]">Нажмите для загрузки</span> или перетащите файл</p>
        <p class="text-xs text-gray-400">.TTML файл</p>
      </div>
    </label>
    <input 
      id="text-file-input" 
      ref="fileInputRef"
      type="file" 
      accept=".ttml,application/ttml+xml" 
      class="hidden" 
      @change="handleFileChange" 
    />

    <div class="my-6 flex items-center w-full max-w-lg">
      <div class="flex-grow border-t border-white/10"></div>
      <span class="flex-shrink mx-4 text-gray-300 text-sm">ИЛИ</span>
      <div class="flex-grow border-t border-white/10"></div>
    </div>
    
    <button
      @click="showPasteArea = true"
      class="flex items-center justify-center gap-3 px-6 py-3 bg-black/20 text-white font-semibold rounded-lg hover:bg-black/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF553E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#5B86E5]"
    >
      <PencilIcon />
      Написать текст
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import SparklesIcon from './icons/SparklesIcon.vue';
import UploadIcon from './icons/UploadIcon.vue';
import PencilIcon from './icons/PencilIcon.vue';
import { SyncedLine } from '../types';
import { parseTTML } from '../services/parser';
import Modal from './Modal.vue';

interface Props {
  text: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{'textChange': [text: string], 'linesUpload': [lines: SyncedLine[]], 'toggleHelper': []}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const showPasteArea = ref(props.text.length > 0);
const isResetSourceModalOpen = ref(false);

const hasText = computed(() => props.text.length > 0);

watch(hasText, (newVal) => {
  if (newVal) {
    showPasteArea.value = true;
  }
});

const scrollToLine = (lineIndex: number) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const lines = textarea.value.split('\n');
  const position = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);
  
  textarea.focus();
  textarea.setSelectionRange(position, position);

  const lineHeight = textarea.scrollHeight / lines.length;
  textarea.scrollTop = (lineIndex * lineHeight) - (textarea.clientHeight / 2);
};

defineExpose({ scrollToLine });

const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const fileContent = e.target?.result as string;
    if (file.name.toLowerCase().endsWith('.ttml') || file.type === 'application/ttml+xml') {
      try {
        const newLines = parseTTML(fileContent);
        emit('linesUpload', newLines);
      } catch (error) { 
        alert(error instanceof Error ? error.message : 'Произошла ошибка при разборе файла.');
      }
    } else {
      alert('Пожалуйста, загрузите файл в формате .ttml');
    }
  };
  reader.readAsText(file);
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    handleFileUpload(file);
  }
  if (target) {
    target.value = ''; 
  }
};

const onDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    if (file.type === 'application/ttml+xml' || file.name.toLowerCase().endsWith('.ttml')) {
      handleFileUpload(file);
    } else {
      alert('Пожалуйста, перетащите файл в формате .ttml');
    }
  }
};

const handleReset = () => {
  emit('textChange', '');
  showPasteArea.value = false;
};

const handleConfirmReset = () => {
  handleReset();
  isResetSourceModalOpen.value = false;
};
</script>
