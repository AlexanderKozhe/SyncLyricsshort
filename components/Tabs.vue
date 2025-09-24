<template>
  <div class="border-b border-white/10 px-6 md:px-8 py-2">
    <nav class="p-1.5 inline-flex items-center gap-2 bg-black/20 rounded-xl" aria-label="Tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        @click="!isTabDisabled(tab.id) && $emit('update:activeTab', tab.id)"
        :disabled="isTabDisabled(tab.id)"
        :class="[
          'whitespace-nowrap rounded-lg py-2.5 px-4 text-sm font-medium transition-[color,background-color,opacity] duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF553E] focus-visible:ring-offset-2 focus-visible:ring-offset-black/20',
          activeTab === tab.id ? 'bg-[#FF553E] text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-black/20',
          isTabDisabled(tab.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
      >
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Tab } from '../types';

interface Props {
  activeTab: Tab;
  isTabDisabled: (tab: Tab) => boolean;
  isAdmin: boolean;
}

defineEmits<{'update:activeTab': [tab: Tab]}>();

const props = defineProps<Props>();

const tabConfig: { id: Tab; label: string }[] = [
  { id: Tab.Audio, label: '1. Аудио' },
  { id: Tab.Text, label: '2. Текст' },
  { id: Tab.Sync, label: '3. Синхронизация' },
  { id: Tab.Result, label: '4. Результат' },
  { id: Tab.Player, label: '5. Плеер' },
  { id: Tab.Admin, label: 'Админ' },
];

const visibleTabs = computed(() => {
  return tabConfig.filter(tab => {
    if (tab.id === Tab.Admin) {
      return props.isAdmin;
    }
    return true;
  });
});
</script>
