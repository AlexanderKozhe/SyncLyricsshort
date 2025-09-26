<template>
  <aside class="w-full max-w-sm flex-shrink-0 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-1 flex flex-col gap-4 h-full">
    <header class="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
      <h3 class="text-lg font-semibold text-white">Помощник</h3>
      <button @click="onClose" class="text-gray-300 hover:text-white">
        <CloseIcon />
      </button>
    </header>
    <div class="flex-grow overflow-y-auto space-y-4 px-3 pb-3 custom-scrollbar">
      <div v-if="isTextEmpty" class="text-center p-8 text-gray-300">
        <p class="text-sm">Введите текст в редакторе, чтобы начать анализ и исправление ошибок.</p>
      </div>
      <div v-else-if="totalIssues > 0">
        <AnalysisSection
          v-for="section in analysisSections"
          :key="section.key"
          :title="section.title"
          :description="section.description"
          :issues="analysisResults[section.key]"
          :issueType="section.key"
          @go-to-issue="onGoToIssue"
          @fix-issue="onFixIssue"
          @fix-all="onFixAll"
          @show-tags-warning="() => isTagsModalOpen = true"
        />
      </div>
      <div v-else class="text-center p-8 text-gray-300">
        <h4 class="font-semibold text-lg text-green-400 mb-2">Все отлично!</h4>
        <p class="text-sm">Проблем с форматированием не найдено.</p>
      </div>
    </div>
  </aside>
  <Modal
    :isOpen="isTagsModalOpen"
    @close="() => isTagsModalOpen = false"
    title="Замена специальных символов"
    confirmText="Принято"
    @confirm="() => isTagsModalOpen = false"
    :cancelText="null"
  >
    <div class="text-sm text-gray-300 space-y-2">
      <p>Пожалуйста, замените специальные символы вручную, следуя правилам:</p>
      <ul class="list-disc list-inside pl-2">
        <li>Вместо <strong>*</strong> напишите полное слово. Если слово зацензурено в аудио, используйте дефис <strong>-</strong>.</li>
        <li>Вместо <strong>+</strong> напишите "плюс".</li>
        <li>Избегайте использования <strong>/</strong>, <strong>%</strong>, <strong>&</strong>, <strong>№</strong>, <strong>@</strong>. Заменяйте их словами.</li>
        <li>Вместо <strong>#</strong> пишите конструкцией <strong>хештег — ""</strong>, если хештег не произносится — просто уберите его.</li>
      </ul>
    </div>
  </Modal>
</template>

<script setup>
import { computed, ref } from 'vue';
import { analyzeText } from '../services/analysis';
import CloseIcon from './icons/CloseIcon.vue';
import WandIcon from './icons/WandIcon.vue';
import Modal from './Modal.vue';
import AnalysisSection from './AnalysisSection.vue';

const props = defineProps({
  lines: Array,
  onClose: Function,
  onGoToIssue: Function,
  onFixIssue: Function,
  onFixAll: Function,
});

const isTagsModalOpen = ref(false);

const analysisResults = computed(() => analyzeText(props.lines));
const totalIssues = computed(() => Object.values(analysisResults.value).reduce((acc, issues) => acc + issues.length, 0));
const isTextEmpty = computed(() => props.lines.length === 0 || props.lines.every(line => line.text.trim() === ''));

const analysisSections = [
    { key: 'startEmpty', title: 'Пустая строка в начале', description: 'Первая строка не должна быть пустой.' },
    { key: 'endEmpty', title: 'Пустая строка в конце', description: 'Последняя строка не должна быть пустой.' },
    { key: 'emptyLines', title: 'Лишние пустые строки', description: 'Более одной пустой строки подряд.' },
    { key: 'trim', title: 'Пробелы по краям', description: 'Лишние пробелы в начале/конце строк.' },
    { key: 'doubleSpaces', title: 'Двойные пробелы', description: 'Несколько пробелов подряд внутри строки.' },
    { key: 'capitalization', title: 'Заглавные буквы', description: 'Строка должна начинаться с заглавной.' },
    { key: 'punctuation', title: 'Пунктуация в конце', description: 'Лишние точки, запятые и др.' },
    { key: 'tags', title: 'Спец. символы', description: 'Найдены символы типа *, +, /, # и др.' },
    { key: 'symbols', title: 'Нестандартные символы', description: 'Неправильные кавычки, тире и т.д.' },
];
</script>
