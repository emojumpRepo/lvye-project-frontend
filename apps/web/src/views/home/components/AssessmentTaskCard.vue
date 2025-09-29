<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';
import { ASSESSMENT_STATUS } from '@vben/types';

import { message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { AssessmentTaskParticipantStatus } from '#/api/constant';
import { checkMyProfileCompleteness } from '#/api/psychology/student-profile';
import BasicInfoDialog from '#/components/Dialog/BasicInfoDialog/index.vue';

const props = defineProps<{ task: AssessmentTask }>();

const userStore = useUserStore();

const router = useRouter();

const basicInfoDialog = ref<InstanceType<typeof BasicInfoDialog>>();

const TASK_STATUS_MAP: Record<
  AssessmentTaskParticipantStatus,
  { actionText: string; tagColor: string; tagText: string }
> = {
  [AssessmentTaskParticipantStatus.NOT_STARTED]: {
    actionText: '去答题',
    tagColor: 'warning',
    tagText: '未开始',
  },
  [AssessmentTaskParticipantStatus.IN_PROGRESS]: {
    actionText: '继续答题',
    tagColor: 'blue',
    tagText: '进行中',
  },
  [AssessmentTaskParticipantStatus.COMPLETED]: {
    actionText: '查看结果',
    tagColor: 'green',
    tagText: '已完成',
  },
};

function getActionText(task: AssessmentTask) {
  if (
    (task as any)?.participantStatus ===
      AssessmentTaskParticipantStatus.COMPLETED &&
    (task as any)?.resultGenerating === true
  )
    return '结果生成中';
  return TASK_STATUS_MAP[task.participantStatus]?.actionText ?? '去答题';
}

function getTagColor(task: AssessmentTask) {
  return TASK_STATUS_MAP[task.participantStatus]?.tagColor ?? 'warning';
}

function getTagText(task: AssessmentTask) {
  return TASK_STATUS_MAP[task.participantStatus]?.tagText ?? '';
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
  if (
    (task as any)?.participantStatus ===
      AssessmentTaskParticipantStatus.COMPLETED &&
    (task as any)?.resultGenerating === true
  ) {
    message.warning('结果显示中，请稍后查看');
    return;
  }
  if (task.status === ASSESSMENT_STATUS.ENDED) {
    message.warning('此测评任务已结束，无法答题哦');
    return;
  }

  switch (task.participantStatus) {
    case 0:
    case 1: {
      privacyModalApi.open();
      break;
    }
    case 2: {
      router.push(`/evaluation/result/${task.taskNo}`);
      break;
    }
  }
}

// 隐私提醒弹窗
const [PrivacyModal, privacyModalApi] = useVbenModal({
  title: '测评须知',
  centered: true,
  closeOnClickModal: false,
  fullscreenButton: false,
  showCancelButton: false,
  closable: false,
  confirmText: '我已知晓，开始测评',
  bordered: false,
  class: 'privacy-modal w-[92vw] sm:w-[85vw] md:max-w-[580px]',
  contentClass: 'p-0 overflow-hidden',
  onConfirm: () => {
    try {
      const { task } = props;
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
    } catch (error) {
      console.error(error);
    }
    privacyModalApi.close();
  },
});
</script>

<template>
  <div
    class="group rounded-2xl border border-emerald-100/60 bg-white/70 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex items-center justify-between">
          <div class="truncate text-base font-semibold text-emerald-900">
            {{ task.taskName }}
          </div>
          <Tag :color="getTagColor(task)" :bordered="false">
            {{ getTagText(task) }}
          </Tag>
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
        class="box-border shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        :disabled="
          ((task as any)?.participantStatus ===
            AssessmentTaskParticipantStatus.COMPLETED &&
            (task as any)?.resultGenerating === true) ||
          (task.status === ASSESSMENT_STATUS.ENDED &&
            task.participantStatus !==
              AssessmentTaskParticipantStatus.COMPLETED)
        "
        @click="handleClick"
      >
        {{ getActionText(task) }}
      </button>
    </div>
    <BasicInfoDialog ref="basicInfoDialog" />

    <!-- 隐私提醒弹窗 -->
    <PrivacyModal>
      <template #title>
        <div
          class="flex items-center gap-2.5 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white"
          >
            <IconifyIcon icon="lucide:shield-check" class="h-5 w-5" />
          </div>
          <h3
            class="bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-lg font-bold text-transparent"
          >
            测评须知
          </h3>
          <span class="ml-auto text-sm text-amber-600">🔒 隐私保护</span>
        </div>
      </template>

      <template #default>
        <div class="bg-white px-5 py-4">
          <!-- 问候语 -->
          <div class="mb-3 text-center">
            <span class="text-base font-semibold text-amber-900"
              >亲爱的同学，欢迎参加身心健康调查！</span
            >
          </div>

          <!-- 三列网格布局 -->
          <div class="mb-3 grid gap-2.5 sm:grid-cols-3">
            <!-- 调查目的 -->
            <div
              class="rounded-lg border border-amber-100 bg-amber-50/60 p-2.5"
            >
              <div class="mb-1.5 flex items-center gap-1.5">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800"
                  >1</span
                >
                <span class="text-sm font-semibold text-amber-800"
                  >调查目的</span
                >
              </div>
              <p class="text-sm leading-relaxed text-amber-700">
                了解同学们身心健康，提供更好的支持服务
              </p>
            </div>

            <!-- 参与方式 -->
            <div
              class="rounded-lg border border-orange-100 bg-orange-50/60 p-2.5"
            >
              <div class="mb-1.5 flex items-center gap-1.5">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-800"
                  >2</span
                >
                <span class="text-sm font-semibold text-orange-800"
                  >参与方式</span
                >
              </div>
              <p class="text-sm leading-relaxed text-orange-700">
                <span
                  class="inline-block rounded bg-orange-100/80 px-1.5 py-0.5 font-medium"
                  >自愿</span
                >
                问卷调查
              </p>
            </div>

            <!-- 需要帮助 -->
            <div
              class="rounded-lg border border-amber-100 bg-amber-50/60 p-2.5"
            >
              <div class="mb-1.5 flex items-center gap-1.5">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800"
                  >3</span
                >
                <span class="text-sm font-semibold text-amber-800"
                  >需要帮助</span
                >
              </div>
              <p class="text-sm leading-relaxed text-amber-700">
                遇到困难请联系老师
              </p>
            </div>
          </div>

          <!-- 隐私保护区域 -->
          <div
            class="mb-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 p-[1px]"
          >
            <div class="rounded-lg bg-white p-3">
              <div class="flex items-start gap-2">
                <IconifyIcon
                  icon="lucide:lock"
                  class="mt-0.5 h-4 w-4 text-amber-600"
                />
                <div class="flex-1">
                  <h5 class="text-sm font-semibold text-amber-900">
                    隐私保护承诺
                  </h5>
                  <p class="mt-1 text-sm leading-relaxed text-amber-800">
                    我们严格保密你的所有信息，仅用于健康分析，不会泄露给任何第三方
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 调查意义 -->
          <div
            class="mb-3 rounded-lg bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-2.5"
          >
            <div class="flex items-start gap-2">
              <IconifyIcon
                icon="lucide:target"
                class="mt-0.5 h-4 w-4 text-amber-600"
              />
              <div class="flex-1">
                <p class="text-sm font-medium text-amber-800">
                  调查结果将用于：
                </p>
                <ul class="mt-1 space-y-0.5 text-sm text-amber-700">
                  <li>• 制定更好的身心健康服务策略</li>
                  <li>• 提供有针对性的支持和帮助</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 确认区域 -->
          <div
            class="rounded-lg bg-gradient-to-r from-amber-100/40 to-orange-100/40 p-3 text-center"
          >
            <p class="text-sm font-medium text-amber-800">
              如你已了解并同意参与，请点击下方按钮开始测评 ✨
            </p>
          </div>
        </div>
      </template>
    </PrivacyModal>
  </div>
</template>

<style scoped>
/* 响应式优化 */
@media (max-width: 640px) {
  :deep(.privacy-modal) {
    border-radius: 20px;
  }

  :deep(.privacy-modal .ant-modal-footer) {
    padding: 12px 16px;
  }

  :deep(.privacy-modal .ant-btn-primary) {
    height: 36px;
    padding: 0 20px;
    font-size: 13px;
    border-radius: 10px;
  }
}

:deep(.privacy-modal) {
  overflow: hidden;
  background: linear-gradient(135deg, #fff 0%, #fffbeb 100%);
  border: 2px solid rgb(251 191 36 / 15%);
  border-radius: 24px;

  /* 去除弹窗阴影 */
  box-shadow: none !important;
}

:deep(.privacy-modal .ant-modal-content) {
  overflow: hidden;
  background: transparent;
  border-radius: 24px;
  box-shadow: none !important;
}

:deep(.privacy-modal .ant-modal-header) {
  padding: 0;
  background: transparent;
  border-bottom: none;
}

/* 合并至下方滚动条优化定义：同时保留 padding/background 设置 */
:deep(.privacy-modal .ant-modal-body) {
  max-height: calc(80vh - 120px);
  padding: 0;
  overflow-y: auto;
  scrollbar-color: rgb(16 185 129 / 30%) transparent;
  scrollbar-width: thin;
  background: transparent;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar) {
  width: 6px;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-thumb) {
  background: rgb(16 185 129 / 30%);
  border-radius: 3px;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-thumb:hover) {
  background: rgb(16 185 129 / 50%);
}

/* 隐私提醒弹窗优化样式 */
</style>
