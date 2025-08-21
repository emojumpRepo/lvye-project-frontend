<script lang="ts" setup>
import type { PsychologyAssessmentApi } from '#/api/psychology/assessment';

import { getStatusColor, getStatusLabel } from '@vben/types';

import { Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

const props = defineProps<{ task: PsychologyAssessmentApi.AssessmentTask }>();
const emit = defineEmits<{
  (e: 'action', task: PsychologyAssessmentApi.AssessmentTask): void;
}>();

function getPercent(task: PsychologyAssessmentApi.AssessmentTask): number {
  if (typeof task.completionRate === 'number') {
    return Math.min(100, Math.max(0, Math.round(task.completionRate)));
  }
  if (
    typeof task.finishNum === 'number' &&
    typeof task.totalNum === 'number' &&
    task.totalNum > 0
  ) {
    return Math.round((task.finishNum / task.totalNum) * 100);
  }
  return 0;
}

function getActionText(task: PsychologyAssessmentApi.AssessmentTask) {
  const percent = getPercent(task);
  if (task.status === 1)
    return percent > 0 && percent < 100 ? '继续答题' : '去答题';
  if (task.status === 2) return '查看结果';
  if (task.status === 3) return '已取消';
  return '开始';
}

function isActionDisabled(task: PsychologyAssessmentApi.AssessmentTask) {
  return task.status === 3;
}

function handleClick() {
  emit('action', props.task);
}
</script>

<template>
  <div
    class="group rounded-2xl border border-emerald-100/60 bg-white/70 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex items-center gap-2">
          <div class="truncate text-base font-semibold text-emerald-900">
            {{ task.taskName }}
          </div>
          <Tag :color="getStatusColor(task.status, 'assessment')">
            {{ getStatusLabel(task.status, 'assessment') }}
          </Tag>
        </div>
        <div class="mb-2 text-xs text-emerald-900/70">
          截止：{{ dayjs(task.deadline).format('YYYY-MM-DD HH:mm') }}
        </div>
        <div class="h-2 w-full rounded-full bg-emerald-100/60">
          <div
            class="h-2 rounded-full bg-emerald-500 transition-all"
            :style="{ width: `${getPercent(task)}%` }"
          ></div>
        </div>
        <div class="mt-1 text-xs text-emerald-900/70">
          完成度：{{ getPercent(task) }}%
        </div>
      </div>
      <button
        class="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        :disabled="isActionDisabled(task)"
        @click="handleClick"
      >
        {{ getActionText(task) }}
      </button>
    </div>
  </div>
</template>
