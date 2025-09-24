<template>
  <div class="h-full flex flex-col">
    <div class="pb-4">
      <h2 class="text-xl font-semibold mb-1 text-white">Шаг 4: Результаты</h2>
      <p class="text-gray-300">Ваши синхронизированные файлы готовы. Вы можете скопировать содержимое или скачать файлы.</p>
    </div>
    <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
      <ResultCard title="TTML" :data="ttml" file-extension="ttml" :audio-file-name="audioFileName" :is-locked="noAudioMode" />
      <ResultCard title="LRC" :data="lrc" file-extension="lrc" :audio-file-name="audioFileName" :is-locked="noAudioMode" />
      <ResultCard title="TXT" :data="txt" file-extension="txt" :audio-file-name="audioFileName" />
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { toTTML, toLRC, toTXT } from '../services/formatter';
import ResultCard from './ResultCard.vue';

const props = defineProps({
  lines: Array,
  audioDuration: Number,
  audioFileName: String,
  noAudioMode: Boolean,
});

const ttml = ref('');
const lrc = ref('');
const txt = ref('');

watchEffect(() => {
  ttml.value = toTTML(props.lines, props.audioDuration);
  lrc.value = toLRC(props.lines);
  txt.value = toTXT(props.lines);
});
</script>
