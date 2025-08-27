<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { useRouter } from 'vue-router';

import { ASSESSMENT_STATUS } from '@vben/types';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { AssessmentTaskParticipantStatus } from '#/api/constant';

const props = defineProps<{ task: AssessmentTask }>();

const router = useRouter();

function getActionText(task: AssessmentTask) {
  switch (task.participantStatus) {
    case AssessmentTaskParticipantStatus.COMPLETED: {
      return '查看结果';
    }
    case AssessmentTaskParticipantStatus.IN_PROGRESS: {
      return '继续答题';
    }
    case AssessmentTaskParticipantStatus.NOT_STARTED: {
      return '去答题';
    }
    default: {
      return '去答题';
    }
  }
}

function isActionDisabled(task: AssessmentTask) {
  return task.status === ASSESSMENT_STATUS.ENDED;
}

function handleClick() {
  const { task } = props;
  if (task.status === ASSESSMENT_STATUS.ENDED) {
    message.warning('此测评任务已结束，无法答题哦');
  }
  if (task.scenarioId) {
    router.push({
      path: '/evaluation/scene',
      query: {
        taskNo: task.taskNo,
      },
    });
  } else {
    router.push(`/evaluation/assessment/${task.taskNo}`);
  }

  // switch (task.participantStatus) {
  //   case 0:
  //   case 1: {
  //     if (task.scenarioId) {
  //       router.push({
  //         path: '/evaluation/scene',
  //         query: {
  //           taskNo: task.taskNo,
  //         },
  //       });
  //     } else {
  //       router.push(`/evaluation/assessment/${task.taskNo}`);
  //     }
  //     break;
  //   }
  //   case 2: {
  //     router.push('/evaluation/result');
  //     break;
  //   }
  // }
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
        </div>
        <div class="mb-2 text-xs text-emerald-900/70">
          截止于：{{ dayjs(task.deadline).format('YYYY-MM-DD HH:mm') }}
        </div>
        <div class="h-2 w-full rounded-full bg-emerald-100/60">
          <div
            class="h-2 rounded-full bg-emerald-500 transition-all"
            :style="{ width: `${task.progress}%` }"
          ></div>
        </div>
        <div class="mt-1 text-xs text-emerald-900/70">
          完成度：{{ task.progress }}%
        </div>
      </div>
      <button
        v-if="task.status !== ASSESSMENT_STATUS.ENDED"
        class="box-border w-24 shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        :disabled="isActionDisabled(task)"
        @click="handleClick"
      >
        {{ getActionText(task) }}
      </button>
    </div>
  </div>
</template>
