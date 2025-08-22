<script setup lang="ts">
import LyCardTitle from '#/components/LyCardTitle/index.vue';

// 定义任务信息的数据结构
interface TaskInfo {
  task: {
    createTime: string;
    endTime: string;
    questionnaireName: string;
    status: string;
    taskNo: string;
  };
  participate: {
    completed: number;
    completionRate: number;
    total: number;
  };
  riskDistribution: {
    attention: number;
    highRisk: number;
    normal: number;
    warning: number;
  };
}

const props = defineProps<{
  loading: boolean;
  taskInfo: TaskInfo;
}>();
</script>

<template>
  <div class="box-border flex flex-col gap-6 rounded-xl bg-white p-6">
    <a-spin :spinning="props.loading">
      <div>
        <LyCardTitle
          icon="mingcute:task-2-fill"
          title="任务信息"
          icon-bg="linear-gradient(143.39deg, #24fcc9 11.39%, #3dbbfa 89.3%)"
        />
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span>任务</span>
            <span class="text-[#4C4C4D]">{{
              props.taskInfo?.task?.taskNo
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>测评量表</span>
            <span class="text-[#4C4C4D]">{{
              props.taskInfo.task.questionnaireName
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>创建时间</span>
            <span class="text-[#4C4C4D]">{{
              props.taskInfo.task.createTime
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>截止时间</span>
            <span class="text-[#4C4C4D]">{{
              props.taskInfo.task.endTime
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>任务状态</span>
            <span class="text-[#4C4C4D]">{{ props.taskInfo.task.status }}</span>
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
              {{ props.taskInfo.participate.total }}
            </div>
            <div class="mt-2 text-xs text-[#979899]">应参与人数</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">
              {{ props.taskInfo.participate.completed }}
            </div>
            <div class="mt-2 text-xs text-[#979899]">已完成人数</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">
              {{ props.taskInfo.participate.completionRate }}%
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
              <span class="h-3 w-3 rounded bg-[#04DC70]"></span
              ><span>正常</span>
            </div>
            <span class="text-[#979899]">
              {{ props.taskInfo.riskDistribution.normal }}人
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-sm">
              <span class="h-3 w-3 rounded bg-[#1966FF]"></span
              ><span>关注</span>
            </div>
            <span class="text-[#979899]">
              {{ props.taskInfo.riskDistribution.attention }}人
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-sm">
              <span class="h-3 w-3 rounded bg-[#FF9C05]"></span
              ><span>预警</span>
            </div>
            <span class="text-[#979899]">
              {{ props.taskInfo.riskDistribution.warning }}人
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-sm">
              <span class="h-3 w-3 rounded bg-[#FF0831]"></span
              ><span>高危</span>
            </div>
            <span class="text-[#979899]">
              {{ props.taskInfo.riskDistribution.highRisk }}人
            </span>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>
