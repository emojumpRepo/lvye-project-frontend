<script setup lang="ts">
import type { QuestionnaireAnswerDataVO } from '@vben/types';

import { computed } from 'vue';

interface Props {
  answers?: QuestionnaireAnswerDataVO[];
}

const props = withDefaults(defineProps<Props>(), {
  answers: () => [],
});

// 将回答中的 HTML 转义符解码为实际符号
function formatAnswer(answer?: string): string {
  if (!answer) return '';
  const preReplaced = answer
    .replaceAll('&lt;=', '<=')
    .replaceAll('&gt;=', '>=')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(/&le;|&leq;/g, '<=')
    .replaceAll(/&ge;|&geq;/g, '>=')
    .replaceAll('&equals;', '=')
    .replaceAll('&#61;', '=');
  return preReplaced;
}

// 计算总分
const totalScore = computed(() => {
  return props.answers.reduce((sum, item) => sum + item.score, 0);
});

// 计算已答题数
const answeredCount = computed(() => {
  return props.answers.filter(
    (item) => item.answer && item.answer.trim() !== '',
  ).length;
});

// 计算未答题数
const unansweredCount = computed(() => {
  return props.answers.length - answeredCount.value;
});
</script>

<template>
  <div class="questionnaire-answer px-6">
    <!-- 统计信息 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="rounded-lg border border-[#1966FF]/30 bg-[#1966FF14] p-4 text-center"
      >
        <div class="text-2xl font-bold text-[#1966FF]">{{ answeredCount }}</div>
        <div class="text-sm text-[#1966FF]/70">已答题数</div>
      </div>
      <div
        class="rounded-lg border border-[#FF0831]/30 bg-[#FF083114] p-4 text-center"
      >
        <div class="text-2xl font-bold text-[#FF0831]">
          {{ unansweredCount }}
        </div>
        <div class="text-sm text-[#FF0831]/70">未答题数</div>
      </div>
      <div
        class="rounded-lg border border-[#04DC70]/30 bg-[#14E77E0A] p-4 text-center"
      >
        <div class="text-primary text-2xl font-bold">{{ totalScore }}</div>
        <div class="text-primary/70 text-sm">总得分</div>
      </div>
    </div>

    <!-- 答题列表 -->
    <div class="space-y-4">
      <div
        v-for="item in answers"
        :key="item.index"
        class="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
      >
        <!-- 题目标题 -->
        <div class="mb-3 flex items-center gap-3">
          <div
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1966FF14] text-sm font-medium text-[#1966FF]"
          >
            {{ item.index }}
          </div>
          <div class="flex-1">
            <p class="font-medium leading-relaxed text-gray-800">
              {{ item.title }}
            </p>
          </div>
        </div>

        <!-- 答案和分数 -->
        <div class="ml-11 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">答案：</span>
            <span
              v-if="item.answer"
              class="inline-flex items-center rounded-full bg-[#1966FF14] px-3 py-1 text-sm font-medium text-[#1966FF]"
            >
              {{ formatAnswer(item.answer) }}
            </span>
            <span
              v-else
              class="inline-flex items-center rounded-full bg-[#FF083114] px-3 py-1 text-sm font-medium text-[#FF0831]"
            >
              未作答
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">得分：</span>
            <span
              class="text-primary inline-flex items-center rounded bg-[#14E77E14] px-2 py-1 text-sm font-bold"
            >
              {{ item.score }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- <style scoped>
.questionnaire-answer {
  max-height: 70vh;
  overflow-y: auto;
}

/* 自定义滚动条样式 */
.questionnaire-answer::-webkit-scrollbar {
  width: 6px;
}

.questionnaire-answer::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.questionnaire-answer::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.questionnaire-answer::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> -->
