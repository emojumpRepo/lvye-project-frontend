<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import { getMyAssessmentTask } from '#/api/psychology/assessment';

import AssessmentTaskCard from './components/AssessmentTaskCard.vue';
import DailyTip from './components/DailyTip.vue';
import KoalaMessage from './components/KoalaMessage.vue';
import WelcomeBanner from './components/WelcomeBanner.vue';

const tasksLoading = ref(false);
const myTasks = ref<AssessmentTask[]>([]);
const dailyTip = ref(
  '当你感到紧张或心情低落时，放慢脚步，做五次深呼吸，闭上眼睛专注在气息上，允许所有感受如云飘过，告诉自己：我正在照顾我的情绪，这一切都会慢慢好起来。',
);

// 隐私提醒弹窗
const PRIVACY_NOTICE_KEY = 'lvye_privacy_notice_ack_v1';
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
      localStorage.setItem(PRIVACY_NOTICE_KEY, '1');
    } catch (error) {
      console.error(error);
    }
    privacyModalApi.close();
  },
});

async function getMyTasks() {
  try {
    tasksLoading.value = true;
    const res = await getMyAssessmentTask();
    myTasks.value =
      (res as unknown as AssessmentTask[]).sort((a, b) => {
        const now = Date.now();
        const progressA = (a as any).progress ?? 0;
        const progressB = (b as any).progress ?? 0;
        const doneA = progressA === 100;
        const doneB = progressB === 100;
        const deadlineA = Number(a.deadline ?? 0);
        const deadlineB = Number(b.deadline ?? 0);
        const expiredA = deadlineA < now;
        const expiredB = deadlineB < now;
        const startTimeA = Number((a as any).startTime ?? 0);
        const startTimeB = Number((b as any).startTime ?? 0);

        // 优先级：未完成/进行中 > 已完成/已截止
        const activeA = !doneA && !expiredA;
        const activeB = !doneB && !expiredB;
        const inactiveA = doneA || expiredA;
        const inactiveB = doneB || expiredB;

        if (activeA && inactiveB) return -1;
        if (inactiveA && activeB) return 1;

        // 未完成/进行中：按截止日期升序（更早截止在前）
        if (activeA && activeB && deadlineA !== deadlineB)
          return deadlineA - deadlineB;

        // 已完成/已截止：按开始时间降序（更晚开始在前）
        if (inactiveA && inactiveB && startTimeA !== startTimeB)
          return startTimeB - startTimeA;

        // 兜底：创建时间较新在前
        const createA = Number((a as any).createTime ?? 0);
        const createB = Number((b as any).createTime ?? 0);
        return createB - createA;
      }) || [];
  } catch (error) {
    // 记录错误但不抛出
    console.error(error);
  } finally {
    tasksLoading.value = false;
  }
}

onMounted(async () => {
  // 首次进入首页显示隐私提醒
  try {
    const acknowledged = localStorage.getItem(PRIVACY_NOTICE_KEY) === '1';
    if (!acknowledged) {
      privacyModalApi.open();
    }
  } catch (error) {
    // 本地存储不可用时也尝试弹出
    console.error(error);
    privacyModalApi.open();
  }
  await getMyTasks();
});

function onTaskAction(task: AssessmentTask) {
  // 待接入任务详情或答题路由
  console.warn('TODO: navigate to task detail or answer page', task.taskNo);
}
</script>

<template>
  <Page auto-content-height :height-offset="50">
    <div class="mx-auto flex h-full w-full max-w-[1200px] flex-wrap gap-4">
      <!-- 左边布局（主要内容：小屏优先显示） -->
      <div class="order-1 flex h-full w-full flex-1 flex-col overflow-y-auto">
        <WelcomeBanner />
        <!-- 我的测评任务列表 -->
        <div class="flex-1">
          <div
            class="flex h-full flex-col rounded-3xl border-0 bg-white/60 p-3 shadow backdrop-blur-sm md:p-4"
          >
            <div
              class="mb-3 flex shrink-0 items-center text-lg font-bold text-emerald-900 sm:text-xl"
            >
              <span
                class="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent"
                >我的测评任务
              </span>
            </div>
            <div
              v-if="tasksLoading"
              class="flex flex-1 items-center justify-center"
            >
              <Spin spinning />
            </div>
            <template v-else>
              <div
                v-if="myTasks.length > 0"
                class="flex-1 space-y-3 overflow-y-auto"
              >
                <AssessmentTaskCard
                  v-for="task in myTasks"
                  :key="task.id ?? task.taskNo"
                  :task="task"
                  @action="onTaskAction"
                />
              </div>
              <div v-else class="py-10 text-center text-emerald-900/70">
                暂无任务
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 考拉老师寄语（小屏置后，超大屏固定右侧） -->
      <div
        class="order-2 w-full space-y-4 pb-4 xl:order-2 xl:mb-0 xl:w-[380px]"
      >
        <KoalaMessage />
        <DailyTip :tip="dailyTip" />
      </div>
    </div>

    <!-- 隐私提醒弹窗 -->
    <PrivacyModal>
      <template #title>
        <div class="flex items-center gap-2.5 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white">
            <IconifyIcon icon="lucide:shield-check" class="h-5 w-5" />
          </div>
          <h3 class="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">测评须知</h3>
          <span class="ml-auto text-sm text-amber-600">🔒 隐私保护</span>
        </div>
      </template>
      
      <template #default>
        <div class="bg-white px-5 py-4">
          <!-- 问候语 -->
          <div class="mb-3 text-center">
            <span class="text-base font-semibold text-amber-900">亲爱的同学，欢迎参加身心健康调查！</span>
          </div>
          
          <!-- 三列网格布局 -->
          <div class="grid gap-2.5 sm:grid-cols-3 mb-3">
            <!-- 调查目的 -->
            <div class="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">1</span>
                <span class="text-sm font-semibold text-amber-800">调查目的</span>
              </div>
              <p class="text-sm text-amber-700 leading-relaxed">
                了解同学们身心健康，提供更好的支持服务
              </p>
            </div>
            
            <!-- 参与方式 -->
            <div class="rounded-lg bg-orange-50/60 p-2.5 border border-orange-100">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-800">2</span>
                <span class="text-sm font-semibold text-orange-800">参与方式</span>
              </div>
              <p class="text-sm text-orange-700 leading-relaxed">
                <span class="inline-block rounded bg-orange-100/80 px-1.5 py-0.5 font-medium">自愿</span>
                问卷调查
              </p>
            </div>
            
            <!-- 需要帮助 -->
            <div class="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">3</span>
                <span class="text-sm font-semibold text-amber-800">需要帮助</span>
              </div>
              <p class="text-sm text-amber-700 leading-relaxed">
                遇到困难请联系老师
              </p>
            </div>
          </div>
          
          <!-- 隐私保护区域 -->
          <div class="rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 p-[1px] mb-3">
            <div class="rounded-lg bg-white p-3">
              <div class="flex items-start gap-2">
                <IconifyIcon icon="lucide:lock" class="h-4 w-4 text-amber-600 mt-0.5" />
                <div class="flex-1">
                  <h5 class="text-sm font-semibold text-amber-900">隐私保护承诺</h5>
                  <p class="text-sm text-amber-800 mt-1 leading-relaxed">
                    我们严格保密你的所有信息，仅用于健康分析，不会泄露给任何第三方
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 调查意义 -->
          <div class="rounded-lg bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-2.5 mb-3">
            <div class="flex items-start gap-2">
              <IconifyIcon icon="lucide:target" class="h-4 w-4 text-amber-600 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm text-amber-800 font-medium">调查结果将用于：</p>
                <ul class="text-sm text-amber-700 mt-1 space-y-0.5">
                  <li>• 制定更好的身心健康服务策略</li>
                  <li>• 提供有针对性的支持和帮助</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- 确认区域 -->
          <div class="rounded-lg bg-gradient-to-r from-amber-100/40 to-orange-100/40 p-3 text-center">
            <p class="text-sm font-medium text-amber-800">
              如你已了解并同意参与，请点击下方按钮开始测评 ✨
            </p>
          </div>
        </div>
      </template>
    </PrivacyModal>
  </Page>
</template>

<style scoped>
/* 隐私提醒弹窗优化样式 */
:deep(.privacy-modal) {
  /* 去除弹窗阴影 */
  box-shadow: none !important;
  border: 2px solid rgba(251, 191, 36, 0.15);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

:deep(.privacy-modal .ant-modal-content) {
  box-shadow: none !important;
  border-radius: 24px;
  overflow: hidden;
  background: transparent;
}

:deep(.privacy-modal .ant-modal-header) {
  border-bottom: none;
  padding: 0;
  background: transparent;
}

:deep(.privacy-modal .ant-modal-body) {
  padding: 0;
  background: transparent;
}

:deep(.privacy-modal .ant-modal-footer) {
  border-top: 1px solid rgba(251, 191, 36, 0.15);
  padding: 14px 24px;
  background: linear-gradient(to right, #fffbeb, #fff7ed);
  margin: 0;
}

:deep(.privacy-modal .ant-btn-primary) {
  background: linear-gradient(135deg, #f59e0b 0%, #fb923c 100%);
  border: none;
  border-radius: 12px;
  height: 42px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  padding: 0 28px;
}

:deep(.privacy-modal .ant-btn-primary:hover) {
  background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
  transform: translateY(-1px);
}

:deep(.privacy-modal .ant-btn-primary:active) {
  transform: translateY(0);
}

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
    font-size: 13px;
    padding: 0 20px;
    border-radius: 10px;
  }
}

/* 限制最大高度，确保一屏内显示 */
:deep(.privacy-modal .ant-modal-body) {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}

/* 滚动条优化 */
:deep(.privacy-modal .ant-modal-body) {
  scrollbar-width: thin;
  scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar) {
  width: 6px;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-thumb) {
  background: rgba(16, 185, 129, 0.3);
  border-radius: 3px;
}

:deep(.privacy-modal .ant-modal-body::-webkit-scrollbar-thumb:hover) {
  background: rgba(16, 185, 129, 0.5);
}
</style>
