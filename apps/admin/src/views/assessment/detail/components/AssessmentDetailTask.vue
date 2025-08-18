<script setup lang="ts">
import type {
  AssessmentTaskRespVO,
  AssessmentTaskStatisticsResp,
} from '#/api/assessment/task';

import { onMounted, ref, watchEffect } from 'vue';

import dayjs from 'dayjs';

import {
  getAssessmentTask,
  getAssessmentTaskStatistics,
} from '#/api/assessment/task';
import LyCardTitle from '#/components/LyCardTitle/index.vue';

const props = defineProps<{ taskNo: string }>();

const taskInfo = ref({
  task: {
    taskId: '',
    questionnaireName: '',
    createTime: '',
    endTime: '',
    status: '',
  },
  participate: { total: 0, completed: 0, completionRate: 0 },
  riskDistribution: { normal: 0, attention: 0, warning: 0, highRisk: 0 },
});

async function loadTask() {
  const base: AssessmentTaskRespVO = await getAssessmentTask(props.taskNo);
  const stats: AssessmentTaskStatisticsResp = await getAssessmentTaskStatistics(
    Number(base.id),
  );
  taskInfo.value = {
    task: {
      taskId: base.taskNo,
      questionnaireName: base.scaleCode,
      createTime: dayjs(base.createTime).format('YYYY-MM-DD HH:mm'),
      endTime: base.deadline
        ? dayjs(base.deadline).format('YYYY-MM-DD HH:mm')
        : '-',
      status: String(base.status ?? ''),
    },
    participate: {
      total: Number(stats.totalParticipants ?? 0),
      completed: Number(stats.completedParticipants ?? 0),
      completionRate: Number(stats.completionRate ?? 0),
    },
    riskDistribution: {
      normal: Number(stats.notStartedParticipants ?? 0),
      attention: Number(stats.inProgressParticipants ?? 0),
      warning: Math.max(
        0,
        Number(stats.totalParticipants ?? 0) -
          Number(stats.inProgressParticipants ?? 0) -
          Number(stats.completedParticipants ?? 0) -
          Number(stats.notStartedParticipants ?? 0),
      ),
      highRisk: 0,
    },
  };
}

onMounted(() => {
  if (props.taskNo) {
    loadTask();
  }
});
watchEffect(() => {
  if (props.taskNo) {
    loadTask();
  }
});
</script>

<template>
  <div class="box-border flex flex-col gap-6 rounded-xl bg-white p-6">
    <div>
      <LyCardTitle
        icon="mingcute:task-2-fill"
        title="任务信息"
        icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
      />
      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span>任务</span>
          <span class="text-[#4C4C4D]">{{ taskInfo.task.taskId }}</span>
        </div>
        <div class="flex justify-between">
          <span>测评量表</span>
          <span class="text-[#4C4C4D]">{{
            taskInfo.task.questionnaireName
          }}</span>
        </div>
        <div class="flex justify-between">
          <span>创建时间</span>
          <span class="text-[#4C4C4D]">{{ taskInfo.task.createTime }}</span>
        </div>
        <div class="flex justify-between">
          <span>截止时间</span>
          <span class="text-[#4C4C4D]">{{ taskInfo.task.endTime }}</span>
        </div>
        <div class="flex justify-between">
          <span>任务状态</span>
          <span class="text-[#4C4C4D]">{{ taskInfo.task.status }}</span>
        </div>
      </div>
    </div>

    <div>
      <LyCardTitle
        icon="tdesign:user-filled"
        title="参与情况"
        icon-bg="linear-gradient(143.39deg, #d0e2ff 11.39%, #3d7cfa 89.3%)"
      />
      <div class="box-border grid grid-cols-3 gap-10 p-4">
        <div class="text-center">
          <div class="text-xl font-bold text-gray-900">
            {{ taskInfo.participate.total }}
          </div>
          <div class="mt-2 text-xs text-[#979899]">应参与人数</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-gray-900">
            {{ taskInfo.participate.completed }}
          </div>
          <div class="mt-2 text-xs text-[#979899]">已完成人数</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold text-gray-900">
            {{ taskInfo.participate.completionRate }}%
          </div>
          <div class="mt-2 text-xs text-[#979899]">完成率</div>
        </div>
      </div>
    </div>

    <div>
      <LyCardTitle
        icon="ph:bell-ringing-fill"
        title="风险分布"
        icon-bg="linear-gradient(143.39deg, #ffb46e 11.39%, #ff6c43 89.3%)"
      />
      <div class="mt-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#04DC70]"></span><span>正常</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.normal }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#1966FF]"></span><span>关注</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.attention }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#FF9C05]"></span><span>预警</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.warning }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#FF0831]"></span><span>高危</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.highRisk }}人
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
