<script setup lang="ts">
import type { AssessmentTaskRiskLevelStatistics } from '@vben/types';

import { computed, ref, watch } from 'vue';

import {
  Empty as AEmpty,
  Progress as AProgress,
  Spin as ASpin,
  message,
} from 'ant-design-vue';

import { getAssessmentTaskRiskLevelStatistics } from '#/api/psychology/assessment/index';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { getDictLabel } from '#/utils/dict';

interface RiskLevelConfig {
  level: number;
  color: string;
  bgColor?: string;
}

const props = defineProps<{
  loading: boolean;
  taskNo: string;
}>();

const assessmentTaskRiskLevelStatistics =
  ref<AssessmentTaskRiskLevelStatistics>();

// 风险等级配置
const riskLevelConfigs: RiskLevelConfig[] = [
  { level: 4, color: '#FF0831' },
  { level: 3, color: '#FF9C05' },
  { level: 2, color: '#1966FF' },
  { level: 1, color: '#04DC70' },
];

// 计算风险等级统计数据
const riskLevelStats = computed(() => {
  if (!assessmentTaskRiskLevelStatistics.value?.totalList) {
    return [];
  }

  const statsMap = new Map(
    assessmentTaskRiskLevelStatistics.value.totalList.map((item) => [
      item.riskLevel,
      item.count,
    ]),
  );

  return riskLevelConfigs.map((config) => ({
    ...config,
    count: statsMap.get(config.level) || 0,
    label: getDictLabel('questionnaire_result_risk_level', config.level),
  }));
});

watch(
  () => props.taskNo,
  async (newTaskNo: string) => {
    if (newTaskNo) {
      try {
        const response = await getAssessmentTaskRiskLevelStatistics(newTaskNo);
        if (!response) {
          assessmentTaskRiskLevelStatistics.value = undefined;
          return message.error('获取风险统计信息失败');
        }
        assessmentTaskRiskLevelStatistics.value = response;
      } catch (error) {
        console.error('获取风险统计信息失败', error);
        message.error('获取风险统计信息失败，请重试');
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="box-border flex h-full flex-col gap-6 rounded-xl bg-white p-6">
    <ASpin :spinning="props.loading">
      <div class="flex h-full flex-col justify-between">
        <div class="flex-1">
          <LyCardTitle
            icon="material-symbols:error-rounded"
            title="风险分布"
            hide-line
            icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
          />

          <div v-if="assessmentTaskRiskLevelStatistics" class="mt-6 space-y-6">
            <div class="mt-6 grid grid-cols-4 gap-4">
              <div
                v-for="stat in riskLevelStats"
                :key="stat.level"
                class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
              >
                <span
                  class="text-2xl font-bold"
                  :class="stat.bgColor"
                  :style="{ color: stat.bgColor ? undefined : stat.color }"
                >
                  {{ stat.count }}
                </span>
                <span class="text-xs text-[#979899]">
                  {{ stat.label }}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-2 rounded-2xl bg-[#F7F8FA] p-4">
              <div class="flex items-center justify-between gap-10">
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

          <div v-else class="flex-center h-full">
            <AEmpty />
          </div>
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

:deep(.ant-spin-nested-loading) {
  height: 100% !important;
}

:deep(.ant-spin-container) {
  height: 100% !important;
}
</style>
