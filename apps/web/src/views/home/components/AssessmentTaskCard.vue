<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';
import { ASSESSMENT_STATUS } from '@vben/types';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { AssessmentTaskParticipantStatus } from '#/api/constant';
import { checkMyProfileCompleteness } from '#/api/psychology/student-profile';
import BasicInfoDialog from '#/components/Dialog/BasicInfoDialog/index.vue';

const props = defineProps<{ task: AssessmentTask }>();

const userStore = useUserStore();

const router = useRouter();

const basicInfoDialog = ref<InstanceType<typeof BasicInfoDialog>>();

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

/**
 * 检查是否需要打开基本信息对话框
 * @returns 是否需要打开基本信息对话框
 */
async function checkAndOpenBasicInfoDialog() {
  try {
    const isParent = Boolean(userStore.userInfo?.isParent);
    if (isParent) return;
    const res = await checkMyProfileCompleteness();
    if (!res?.isComplete) {
      message.info('请完善个人信息再进行测评');
      basicInfoDialog.value?.open();
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return true;
  }
}

async function handleClick() {
  // 检查是否需要打开基本信息对话框
  const isNeedOpenBasicInfoDialog = await checkAndOpenBasicInfoDialog();
  if (isNeedOpenBasicInfoDialog) return;

  // 根据任务状态和场景ID跳转
  const { task } = props;
  if (task.status === ASSESSMENT_STATUS.ENDED) {
    message.warning('此测评任务已结束，无法答题哦');
  }

  switch (task.participantStatus) {
    case 0:
    case 1: {
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
      break;
    }
    case 2: {
      router.push('/evaluation/result');
      break;
    }
  }
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
    <BasicInfoDialog ref="basicInfoDialog" />
  </div>
</template>
