<script setup lang="ts">
import { ref } from 'vue';

import {
  Pagination as APagination,
  Progress as AProgress,
  Spin as ASpin,
} from 'ant-design-vue';

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

const currentPage = ref(1);
const pageSize = ref(5);
const totalPages = ref(20);

const goToPage = (p: number) => {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p;
};
</script>

<template>
  <div class="box-border flex h-full flex-col gap-6 rounded-xl bg-white p-6">
    <ASpin :spinning="props.loading">
      <div class="flex h-full flex-col justify-between">
        <div class="space-y-6">
          <LyCardTitle
            icon="material-symbols:error-rounded"
            title="风险分布"
            hide-line
            icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
          />

          <div class="grid grid-cols-4 gap-4">
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-2xl font-bold text-[#FF0831]">20</span>
              <span class="text-xs text-[#979899]">高危</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-2xl font-bold text-[#FF9C05]">20</span>
              <span class="text-xs text-[#979899]">中度</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-2xl font-bold text-[#1966FF]">0</span>
              <span class="text-xs text-[#979899]">关注</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
            >
              <span class="text-primary text-2xl font-bold">20</span>
              <span class="text-xs text-[#979899]">正常</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 rounded-2xl bg-[#F7F8FA] p-4">
            <div class="flex items-center justify-between gap-8">
              <span class="whitespace-nowrap font-bold">一年级</span>
              <span class="text-primary whitespace-nowrap text-sm">100</span>
              <span class="whitespace-nowrap text-sm text-[#FF9C05]">40</span>
              <span class="whitespace-nowrap text-sm text-[#FF0831]">20</span>
              <AProgress
                :percent="80"
                :size="14"
                :show-info="false"
                :success="{ percent: 40 }"
                trail-color="#FF0831"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end self-end">
          <APagination
            :current="currentPage"
            :page-size="pageSize"
            :total="20"
            @change="goToPage"
          />
        </div>
      </div>
    </ASpin>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-progress-line) {
  margin-bottom: 5px !important;
}

:deep(.ant-progress-bg) {
  background-color: #ff9c05 !important;
}
</style>
