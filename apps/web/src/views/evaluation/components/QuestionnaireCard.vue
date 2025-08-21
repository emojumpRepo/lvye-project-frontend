<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import { useRouter } from 'vue-router';

import { AlarmClockCheck, ScrollText } from '@vben/icons';
import { getStatusColor, getStatusLabel } from '@vben/types';

defineProps<{
  questionnaire: QuestionnaireVO;
}>();

const router = useRouter();

function handleStartQuestionnaire(questionnaire: QuestionnaireVO) {
  router.push({
    path: '/evaluation/questionnaire',
    query: {
      questionnaireId: questionnaire.id,
    },
  });
}
</script>

<template>
  <div
    :key="questionnaire.id"
    class="group relative overflow-hidden rounded-2xl bg-white/60 p-6 backdrop-blur-sm transition-all duration-300"
  >
    <!-- 状态标签 -->
    <div class="absolute right-4 top-4">
      <span
        class="rounded-full px-3 py-1 text-xs font-medium"
        :class="getStatusColor(questionnaire.status || 0, 'questionnaire')"
      >
        {{ getStatusLabel(questionnaire.status || 0, 'questionnaire') }}
      </span>
    </div>

    <!-- 标题和描述 -->
    <h3 class="mb-2 text-lg font-bold text-emerald-900">
      {{ questionnaire.title }}
    </h3>
    <p class="mb-4 line-clamp-2 text-sm text-emerald-600">
      {{ questionnaire.description }}
    </p>

    <!-- 信息栏 -->
    <div
      class="mb-4 flex items-center justify-between text-xs text-emerald-500"
    >
      <div class="flex items-center gap-1">
        <AlarmClockCheck class="h-4 w-4" />
        <span>{{ questionnaire.estimatedDuration }}分钟</span>
      </div>
      <div class="flex items-center gap-1">
        <ScrollText class="h-4 w-4" />
        <span>{{ questionnaire.questionCount }}题</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <button
      class="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-medium text-white transition-all duration-300 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg active:scale-95"
      @click="handleStartQuestionnaire(questionnaire)"
    >
      开始答题
    </button>
  </div>
</template>
