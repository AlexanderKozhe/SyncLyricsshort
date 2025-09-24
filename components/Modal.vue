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
      class="relative w-full max-w-md m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white"
      @click.stop
      tabindex="-1"
      role="document"
    >
      <div class="flex items-start justify-between p-5 border-b border-white/10 rounded-t">
        <h3 class="text-xl font-semibold text-white" id="modal-title">
          {{ title }}
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
      <div class="p-6 space-y-4 text-gray-300">
        <slot></slot>
      </div>
      <div class="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
        <button
          v-if="cancelText"
          @click="onClose"
          type="button"
          class="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          v-if="confirmText && onConfirm"
          @click="onConfirm"
          type="button"
          :disabled="isConfirmDisabled"
          :class="['px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:ring-4 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed', confirmButtonClass]"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import CloseIcon from './icons/CloseIcon.vue';

const props = defineProps({
  isOpen: Boolean,
  onClose: Function,
  onConfirm: Function,
  title: String,
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  isConfirmDisabled: {
    type: Boolean,
    default: false,
  },
});

const modalRef = ref(null);

const confirmButtonClass = "bg-[#FF553E] hover:bg-[#ff7b6b] focus:ring-[#FF553E]";

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    props.onClose();
  }
};

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => modalRef.value?.focus(), 50);
  } else {
    document.removeEventListener('keydown', handleKeyDown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
