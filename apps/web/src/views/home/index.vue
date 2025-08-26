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
    // 兼容 PageResult 结构
    console.warn(res);

    myTasks.value = (res as unknown as AssessmentTask[]) || [];
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
    <div class="h-full overflow-hidden p-4 lg:p-6">
      <!-- 一屏布局：左8/右4 -->
      <div
        class="grid h-full grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12 lg:[grid-template-rows:auto_1fr]"
      >
        <!-- 欢迎横幅 -->
        <div class="lg:col-span-8">
          <WelcomeBanner />
        </div>

        <!-- 考拉老师寄语 -->
        <div class="lg:col-span-4">
          <KoalaMessage />
        </div>

        <!-- 测评快速入口（左下：标题 + 三卡并排，占据一格） -->
        <!-- <div class="lg:col-span-8">
        <AssessmentCards :items="assessments" />
      </div> -->

        <!-- 我的测评任务列表 -->
        <div class="h-full overflow-hidden lg:col-span-8">
          <div
            class="flex h-full flex-col overflow-hidden rounded-3xl border-0 bg-white/60 p-4 shadow backdrop-blur-sm"
          >
            <div
              class="mb-3 flex shrink-0 items-center text-xl font-bold text-emerald-900"
            >
              <span
                class="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent"
                >我的测评任务</span>
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

        <!-- 右下：小贴士 + 正念音频 二分栏堆叠，占据一格 -->
        <div class="flex h-full gap-4 lg:col-span-4">
          <!-- 小贴士 -->
          <DailyTip :tip="dailyTip" />
        </div>
      </div>
    </div>
  </Page>
</template>
