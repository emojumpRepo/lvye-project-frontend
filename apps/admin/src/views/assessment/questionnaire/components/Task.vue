<script setup lang="ts">
import { ref } from 'vue';

import LyCardTitle from '#/components/LyCardTitle/index.vue';

const taskInfo = ref({
  task: {
    taskId: 'TSK_2025_8A7',
    questionnaireName: '初测动态测评问卷',
    createTime: '2025-01-01',
    endTime: '2025-01-01',
    status: '进行中', // 进行中 已结束 已取消
  },
  // 参与情况
  participate: {
    total: 20, // 应参与人数
    completed: 0, // 已完成人数
    completionRate: 80, // 完成率
  },
  // 风险分布
  riskDistribution: {
    normal: 100, // 正常
    attention: 100, // 关注
    warning: 100, // 预警
    highRisk: 0, // 高危
  },
});
</script>

<template>
  <div class="box-border flex flex-col gap-6 rounded-xl bg-white p-6">
    <!-- 任务信息 -->
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

    <!-- 参与情况 -->
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

    <!-- 风险分布 -->
    <div>
      <LyCardTitle
        icon="ph:bell-ringing-fill"
        title="风险分布"
        icon-bg="linear-gradient(143.39deg, #ffb46e 11.39%, #ff6c43 89.3%)"
      />

      <div class="mt-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#04DC70]"></span>
            <span>正常</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.normal }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#1966FF]"></span>
            <span>正常</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.normal }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#FF9C05]"></span>
            <span>正常</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.normal }}人
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-sm">
            <span class="h-3 w-3 rounded bg-[#FF0831]"></span>
            <span>正常</span>
          </div>
          <span class="text-[#979899]">
            {{ taskInfo.riskDistribution.normal }}人
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.task-info-icon {
  background: linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%);
}

.participate-icon {
  background: linear-gradient(143.39deg, #d0e2ff 11.39%, #3d7cfa 89.3%);
}

.risk-distribution-icon {
  background: linear-gradient(143.39deg, #ffb46e 11.39%, #ff6c43 89.3%);
}
</style>
