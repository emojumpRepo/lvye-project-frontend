<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

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
  await getMyTasks();
});

function onTaskAction(task: AssessmentTask) {
  // 待接入任务详情或答题路由
  console.warn('TODO: navigate to task detail or answer page', task.taskNo);
}
</script>

<template>
  <Page auto-content-height :height-offset="50">
    <div class="flex h-full w-full flex-wrap gap-4">
      <!-- 左边布局 -->
      <div class="flex h-full flex-1 flex-col overflow-y-auto">
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

      <!-- 考拉老师寄语 -->
      <div class="h-full space-y-4 sm:col-span-4 lg:w-[380px]">
        <KoalaMessage />
        <DailyTip :tip="dailyTip" />
      </div>
    </div>
  </Page>
</template>
