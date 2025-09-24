<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    @click="onClose"
  >
    <div
      ref="modalRef"
      class="relative w-full max-w-sm m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white"
      @click.stop
      tabindex="-1"
    >
      <div class="flex items-start justify-between p-5 border-b border-white/10 rounded-t">
        <h3 class="text-xl font-semibold text-white" id="modal-title">
          Введите название файла
        </h3>
        <button
          type="button"
          class="text-gray-300 bg-transparent hover:bg-white/10 hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          @click="onClose"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="p-6">
          <label for="filename-input" class="block mb-2 text-sm font-medium text-gray-200">Название</label>
          <div class="flex items-center">
            <input
              ref="inputRef"
              type="text"
              id="filename-input"
              v-model="filename"
              class="bg-black/20 border border-white/10 text-white text-sm rounded-l-lg focus:ring-[#FF553E] focus:border-[#FF553E] block w-full p-2.5"
              required
            />
            <span class="inline-flex items-center px-3 text-sm text-gray-300 bg-black/30 border border-l-0 border-white/10 rounded-r-md">
              .{{ fileExtension }}
            </span>
          </div>
        </div>
        <div class="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
          <button
            @click="onClose"
            type="button"
            class="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 text-sm font-medium text-white bg-[#FF553E] rounded-lg hover:bg-[#ff7b6b] focus:ring-4 focus:outline-none focus:ring-orange-500 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import CloseIcon from './icons/CloseIcon.vue';

const props = defineProps({
  isOpen: Boolean,
  onClose: Function,
  onConfirm: Function,
  fileExtension: String,
});

const filename = ref('subtitles');
const modalRef = ref(null);
const inputRef = ref(null);

const handleSubmit = () => {
  if (filename.value.trim()) {
    props.onConfirm(filename.value.trim());
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    props.onClose();
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => inputRef.value?.focus(), 100);
  } else {
    document.removeEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
