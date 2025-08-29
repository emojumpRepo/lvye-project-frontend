<script setup lang="ts">
import type { QuestionnaireVO } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { AlarmClockCheck, ScrollText } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useEvaluationStore } from '#/store/evaluation';

const props = defineProps<{
  assessmentTaskNo: string;
  questionnaire: QuestionnaireVO;
}>();
const evaluationStore = useEvaluationStore();
const { startEvaluationWithoutScenario } = evaluationStore;

const router = useRouter();

const loading = ref(false);

async function handleStartQuestionnaire() {
  loading.value = true;
  try {
    if (props.questionnaire.completed) {
      message.success('该问卷已完成，请等待或查看结果哦~');
      return;
    }
    await startEvaluationWithoutScenario(
      props.assessmentTaskNo,
      props.questionnaire,
      router,
    );
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    :key="questionnaire.questionnaireId"
    class="group relative flex flex-col rounded-2xl bg-white/60 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
  >
    <!-- 标题和描述 -->
    <h3 class="mb-2 text-lg font-bold text-emerald-900">
      {{ questionnaire.questionnaireTitle }}
    </h3>
    <div class="mb-4 line-clamp-2 shrink-0 text-sm text-emerald-600">
      {{ questionnaire.description }}
    </div>

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
      class="mt-auto w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 active:scale-95"
      :class="[
        questionnaire.completed
          ? 'border border-emerald-100 bg-emerald-50 text-emerald-600 hover:text-emerald-700'
          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600',
      ]"
      :loading="loading"
      @click="handleStartQuestionnaire()"
    >
      {{ questionnaire.completed ? '已完成' : '开始答题' }}
    </button>
  </div>
</template>
