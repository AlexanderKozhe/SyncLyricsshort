<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div class="relative w-full max-w-md m-4 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg shadow-xl text-white">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-white mb-2">Обнаружен черновик</h2>
        <p v-if="timestamp" class="text-sm text-gray-400 mb-4">{{ formatTimestamp(timestamp) }}</p>
        <p class="text-gray-300 mb-6">{{ message }}</p>
      </div>
      <div class="flex items-center justify-end p-6 space-x-2 border-t border-white/10 rounded-b">
        <button
          @click="onReset"
          type="button"
          class="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 focus:ring-4 focus:outline-none focus:ring-white/10 transition-colors"
        >
          Сбросить
        </button>
        <button
          @click="onRestore"
          class="px-5 py-2.5 text-sm font-medium text-white bg-[#FF553E] rounded-lg hover:bg-[#ff7b6b] transition-colors focus:ring-4 focus:outline-none focus:ring-[#FF553E]"
        >
          Восстановить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean,
  onRestore: Function,
  onReset: Function,
  message: String,
  timestamp: Number,
});

const formatTimestamp = (ts) => {
  if (!ts) return null;
  const date = new Date(ts);
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const month = monthNames[date.getMonth()];
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `от ${day} ${month}, ${time}`;
};
</script>
