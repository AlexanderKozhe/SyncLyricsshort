<template>
  <div v-if="issues.length > 0" class="bg-black/20 p-3 rounded-lg">
    <div class="flex justify-between items-center mb-2">
      <div>
        <h4 class="font-bold text-base text-[#FF553E]">{{ title }} <span class="text-sm text-gray-200">({{ issues.length }})</span></h4>
        <p class="text-xs text-gray-300">{{ description }}</p>
      </div>
      <button
        v-if="issueType !== 'tags'"
        @click="$emit('fix-all', issueType)"
        class="flex items-center gap-1.5 bg-black/30 hover:bg-black/40 text-gray-200 text-xs font-bold py-1 px-2 rounded-md"
      >
        <WandIcon /> Все
      </button>
    </div>
    <ul class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
      <li
        v-for="issue in issues"
        :key="issue.lineId + issue.type"
        class="text-xs bg-black/40 p-2 rounded-md flex justify-between items-center gap-2"
      >
        <span
          class="font-mono truncate cursor-pointer hover:text-[#ff7b6b] flex-grow"
          :title="issue.text"
          @click="$emit('go-to-issue', issue.lineIndex)"
        >
          {{ issue.text || 'Пустая строка' }}
        </span>
        <button
          v-if="issueType === 'tags'"
          @click="$emit('show-tags-warning')"
          class="text-xs text-amber-400 hover:text-amber-300 shrink-0"
        >
          Исправьте
        </button>
        <button
          v-else-if="!structuralIssues.includes(issueType)"
          @click="$emit('fix-issue', issue.lineId, issue.type)"
          class="text-xs text-emerald-400 hover:text-emerald-300 shrink-0"
        >
          Исправить
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import WandIcon from './icons/WandIcon.vue';

defineProps({
  title: String,
  description: String,
  issues: Array,
  issueType: String,
});

defineEmits(['go-to-issue', 'fix-issue', 'fix-all', 'show-tags-warning']);

const structuralIssues = ['emptyLines', 'startEmpty', 'endEmpty'];
</script>
