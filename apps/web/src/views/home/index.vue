<script lang="ts" setup>
import type { AssessmentTask } from '@vben/types';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Spin } from 'ant-design-vue';

import {
  getGeneratingTasks,
  getMyAssessmentTask,
} from '#/api/psychology/assessment';
import { useGlobalPollerStore } from '#/store/globalPoller';

import AssessmentTaskCard from './components/AssessmentTaskCard.vue';
import DailyTip from './components/DailyTip.vue';
import KoalaMessage from './components/KoalaMessage.vue';
import WelcomeBanner from './components/WelcomeBanner.vue';

const tasksLoading = ref(false);
const myTasks = ref<AssessmentTask[]>([]);
const dailyTip = ref(
  '当你感到紧张或心情低落时，放慢脚步，做五次深呼吸，闭上眼睛专注在气息上，允许所有感受如云飘过，告诉自己：我正在照顾我的情绪，这一切都会慢慢好起来。',
);

function hasAnyResultGenerating(tasks: AssessmentTask[]) {
  return tasks.some((t) => (t as any)?.resultGenerating === true);
}

const globalPoller = useGlobalPollerStore();

function startTasksPolling() {
  if (globalPoller.isRunning) return;
  globalPoller.setTasks([
    async () => {
      try {
        const list =
          (await getGeneratingTasks()) as unknown as AssessmentTask[];
        if (Array.isArray(list)) {
          const byTaskNo = new Map<string, AssessmentTask>();
          for (const t of list) byTaskNo.set((t as any).taskNo, t);

          myTasks.value = myTasks.value.map((task) => {
            const key = (task as any).taskNo as string;
            const updated = byTaskNo.get(key);
            if (updated) {
              const isCompleted =
                (task as any)?.participantStatus === 2 ||
                (updated as any)?.participantStatus === 2;
              return {
                ...(task as any),
                ...(updated as any),
                resultGenerating:
                  isCompleted && (updated as any)?.resultGenerating === true,
              } as any;
            }
            if ((task as any).resultGenerating === true && !byTaskNo.has(key)) {
              return { ...(task as any), resultGenerating: false } as any;
            }
            return task;
          });

          // 若当前返回为空且列表中也没有 resultGenerating，则停止轮询
          if (list.length === 0 && !hasAnyResultGenerating(myTasks.value)) {
            stopTasksPolling();
          }
        }
      } catch {
        // 请求失败不停止轮询，静默处理
      }
    },
  ]);
  globalPoller.start(undefined, 10_000);
}

function stopTasksPolling() {
  if (!globalPoller.isRunning) return;
  globalPoller.stop();
}

async function getMyTasks(skipLoading = false) {
  try {
    if (!skipLoading) tasksLoading.value = true;
    const res = await getMyAssessmentTask();
    const tasks = (res as unknown as AssessmentTask[]) || [];

    myTasks.value = tasks.sort(compareTasks);

    // 轮询控制：存在生成中的任务则轮询，否则停止
    if (hasAnyResultGenerating(myTasks.value)) startTasksPolling();
    else stopTasksPolling();
  } catch (error) {
    // 记录错误但不抛出
    console.error(error);
  } finally {
    if (!skipLoading) tasksLoading.value = false;
  }
}

onMounted(async () => {
  await getMyTasks();
});

onUnmounted(() => {
  stopTasksPolling();
});

function onTaskAction(task: AssessmentTask) {
  // 待接入任务详情或答题路由
  console.warn('TODO: navigate to task detail or answer page', task.taskNo);
}

function compareTasks(a: AssessmentTask, b: AssessmentTask) {
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
  const genA = (a as any)?.resultGenerating === true;
  const genB = (b as any)?.resultGenerating === true;

  // 分组优先级：未完成/进行中(0) > 已完成/已截止(1)
  const activeA = !doneA && !expiredA;
  const activeB = !doneB && !expiredB;
  const groupA = activeA ? 0 : 1;
  const groupB = activeB ? 0 : 1;
  if (groupA !== groupB) return groupA - groupB;

  // 组内排序：
  if (groupA === 0) {
    // 未完成/进行中：按截止日期升序
    if (deadlineA !== deadlineB) return deadlineA - deadlineB;
    if (startTimeA !== startTimeB) return startTimeB - startTimeA;
  } else {
    // 已完成/已截止：生成中的在前，然后按开始时间降序
    if (genA !== genB) return genA ? -1 : 1;
    if (startTimeA !== startTimeB) return startTimeB - startTimeA;
  }

  // 兜底：创建时间较新在前
  const createA = Number((a as any).createTime ?? 0);
  const createB = Number((b as any).createTime ?? 0);
  return createB - createA;
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
  </Page>
</template>
