<script setup lang="ts">
import type {
  AssessmentTaskRiskLevelStatistics,
  GradeRiskLevel,
  RiskLevel,
} from '@vben/types';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Collapse as ACollapse,
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
}

const props = defineProps<{
  taskNo: string;
}>();

const assessmentTaskRiskLevelStatistics =
  ref<AssessmentTaskRiskLevelStatistics>();
const activeKey = ref<number>();
const loading = ref(true);

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

/**
 * 获取风险等级进度
 * @param grade 班级风险等级列表
 * @returns 风险等级进度
 */
function getRiskLevelProgress(grade: GradeRiskLevel) {
  const result: Record<string, string> = {};

  grade.riskLevelList.forEach((riskLevel: RiskLevel) => {
    const percent = `${(riskLevel.count / grade.total) * 100}%`;
    const color =
      riskLevelConfigs.find((config) => config.level === riskLevel.riskLevel)
        ?.color || '#000000';

    if (percent !== '0%') {
      result[percent] = color;
    }
  });
  if (Object.keys(result).length === 0) {
    result['100%'] = '#e9eaec';
  }
  return result;
}

watch(
  () => props.taskNo,
  async (newTaskNo: string) => {
    if (newTaskNo) {
      try {
        loading.value = true;
        const response = await getAssessmentTaskRiskLevelStatistics(newTaskNo);
        if (!response) {
          assessmentTaskRiskLevelStatistics.value = undefined;
          return message.error('获取风险统计信息失败');
        }
        assessmentTaskRiskLevelStatistics.value = response;
        activeKey.value = response.gradeList[0]?.gradeDeptId;
        assessmentTaskRiskLevelStatistics.value.gradeList.forEach((grade) => {
          grade.total = 20;
          grade.riskLevelList.forEach((riskLevel: RiskLevel) => {
            riskLevel.color = riskLevelConfigs.find(
              (config) => config.level === riskLevel.riskLevel,
            )?.color;
          });
        });
      } catch (error) {
        console.error('获取风险统计信息失败', error);
        message.error('获取风险统计信息失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="box-border flex h-full flex-col gap-6 rounded-xl bg-white p-6">
    <ASpin :spinning="loading">
      <div class="flex h-full flex-col justify-between gap-6 overflow-hidden">
        <LyCardTitle
          icon="material-symbols:error-rounded"
          title="风险分布"
          hide-line
          icon-bg="linear-gradient(143.39deg, #FFB65D 11.39%, #FC6F24 89.3%)"
        />

        <template v-if="!loading">
          <div
            v-if="assessmentTaskRiskLevelStatistics"
            class="flex flex-1 flex-col gap-6"
          >
            <div class="grid grid-cols-4 gap-4">
              <div
                v-for="stat in riskLevelStats"
                :key="stat.level"
                class="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#EEEFF5] p-4"
              >
                <span class="text-2xl font-bold" :style="{ color: stat.color }">
                  {{ stat.count }}
                </span>
                <span class="text-xs text-[#979899]">
                  {{ stat.label }}
                </span>
              </div>
            </div>

            <div class="scroll-area h-[200px] overflow-y-auto">
              <ACollapse
                v-model:active-key="activeKey"
                accordion
                :bordered="false"
                style="background: #f7f8fa"
              >
                <template #expandIcon="scope">
                  <IconifyIcon
                    icon="bxs:right-arrow"
                    :rotate="scope?.isActive ? 45 : 0"
                    class="size-2.5"
                  />
                </template>
                <ACollapse.Panel
                  v-for="grade in assessmentTaskRiskLevelStatistics?.gradeList"
                  :key="grade.gradeDeptId"
                  :header="grade.gradeName"
                >
                  <div class="flex items-center justify-center gap-12">
                    <div
                      v-for="child in grade.riskLevelList"
                      :key="child.riskLevel"
                      class="flex items-center justify-between"
                    >
                      <span
                        class="text-primary whitespace-nowrap text-sm"
                        :style="{ color: child.color }"
                      >
                        {{ child.count }}
                      </span>
                    </div>
                    <AProgress
                      :percent="100"
                      :size="14"
                      :show-info="false"
                      :stroke-color="getRiskLevelProgress(grade)"
                    />
                  </div>
                </ACollapse.Panel>
              </ACollapse>
            </div>
          </div>

          <div v-else class="flex-center flex-1">
            <AEmpty />
          </div>
        </template>
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

.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 35%);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 999px;
}
</style>
