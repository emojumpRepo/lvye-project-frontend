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
  title: '调查说明',
  centered: true,
  closeOnClickModal: false,
  fullscreenButton: false,
  showCancelButton: false,
  closable: false,
  confirmText: '下一页',
  bordered: false,
  class: 'w-[92vw] sm:max-w-[720px]',
  contentClass: 'p-0',
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
        <div
          class="flex items-start gap-2 border-b border-emerald-100/70 px-4 py-2"
        >
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
          >
            <IconifyIcon icon="lucide:shield-check" class="h-5 w-5" />
          </span>
          <div class="leading-tight">
            <div
              class="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-lg font-semibold text-transparent"
            >
              测评须知
            </div>
            <div class="mt-0.5 text-xs text-emerald-700/80">
              我们承诺严格保密你的信息
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <div class="px-6 py-2">
          <div class="space-y-4 leading-7 text-emerald-900/90">
            <p class="text-base">亲爱的同学，你好!</p>
            <p class="indent-4">
              为更全面深入地了解你的身心健康状况，我们特组织此次调查。本次调查遵循自愿参与原则，主要采用自评问卷的形式对你的整体身心健康状况进行评估，同时我们向你保证，本次调查中你所提供的所有个人资料和隐私信息将被严格保密。
            </p>
            <p class="indent-4">
              本次调查结果将用于中小学生身心健康情况的分析，将会为学校制定更有针对性及更有效的身心健康服务策略、更好地服务和支持各位同学提供重要参考，也对推动该领域的科学研究、全面提升青少年身心整体健康水平具有重要意义。
            </p>
            <p class="indent-4">
              参与调查过程中，如果你在回答问题时遇到困难或感到困惑，请与相关老师联系。
            </p>
            <div
              class="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900"
            >
              如你已知晓并自愿参加本次调查，请点击「下一页」选项，正式进入调查。
            </div>
          </div>
        </div>
      </template>
    </PrivacyModal>
  </Page>
</template>
