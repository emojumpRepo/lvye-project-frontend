<script setup lang="ts">
import type {
  AssessmentTaskRiskLevelStatistics,
  ClassRiskLevel,
  GradeRiskLevel,
  RiskLevel,
} from '@vben/types';

import type { ActiveType, RiskLevelConfig } from '../types';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  Collapse as ACollapse,
  Empty as AEmpty,
  Spin as ASpin,
  message,
} from 'ant-design-vue';

import { getAssessmentTaskRiskLevelStatistics } from '#/api/psychology/assessment/index';
import LyCardTitle from '#/components/LyCardTitle/index.vue';
import { getDictLabel } from '#/utils/dict';

import AssessmentCollapse from './AssessmentCollapse.vue';

const props = defineProps<{
  activeType: ActiveType;
  taskNo: string;
}>();

const assessmentTaskRiskLevelStatistics =
  ref<AssessmentTaskRiskLevelStatistics>();
const loading = ref(true);
const activeKey = ref<number>(0);

// 风险等级配置
const riskLevelConfigs: RiskLevelConfig[] = [
  { level: 1, color: '#04DC70' },
  { level: 2, color: '#1966FF' },
  { level: 3, color: '#FF9C05' },
  { level: 4, color: '#FF0831' },
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

// 风险等级显示组件数据
const riskLevelDeptList = computed(() => {
  const data = assessmentTaskRiskLevelStatistics.value;
  if (!data) return [];

  let deptList;
  if (props.activeType === 'class') {
    // 班级模式：返回所有班级数据
    const allClassList: ClassRiskLevel[] = [];
    data.gradeList.forEach((grade) => {
      if (grade.classList) {
        allClassList.push(...grade.classList);
      }
    });
    deptList = allClassList.map((classItem) => ({
      id: classItem.classDeptId,
      name: classItem.className,
      type: 'class' as const,
      riskLevelList: classItem.riskLevelList,
      progressColor: getRiskLevelProgress(classItem),
    }));
  } else {
    // 年级模式：返回年级数据
    deptList = data.gradeList.map((grade) => ({
      id: grade.gradeDeptId,
      name: grade.gradeName,
      type: 'grade' as const,
      riskLevelList: grade.riskLevelList,
      progressColor: getRiskLevelProgress(grade),
      classList:
        grade.classList?.map((classItem) => ({
          id: classItem.classDeptId,
          name: classItem.className,
          riskLevelList: classItem.riskLevelList,
          progressColor: getRiskLevelProgress(classItem),
        })) || [],
    }));
  }
  return deptList;
});

// 监听数据变化，设置默认激活项
watch(
  () => riskLevelDeptList.value,
  (newList) => {
    if (newList.length > 0 && newList[0]) {
      activeKey.value = newList[0].id;
    }
  },
  { immediate: true },
);

/**
 * 获取风险等级进度
 * @param grade 班级风险等级列表
 * @returns 风险等级进度
 */
function getRiskLevelProgress(grade: ClassRiskLevel | GradeRiskLevel) {
  const result: Array<{ color: string; percent: number }> = [];

  grade.riskLevelList.forEach((riskLevel: RiskLevel) => {
    const percent = (riskLevel.count / grade.total) * 100;
    const color =
      riskLevelConfigs.find((config) => config.level === riskLevel.riskLevel)
        ?.color || '#000000';

    if (percent > 0) {
      result.push({ color, percent });
    }
  });

  // 如果没有数据，显示灰色背景
  if (result.length === 0) {
    result.push({ color: '#e9eaec', percent: 100 });
  }

  return result;
}

watch(
  () => props.taskNo,
  async (newTaskNo: string) => {
    if (newTaskNo) {
      loading.value = true;
      await loadAssessmentTaskRiskLevelStatistics(newTaskNo);
      loading.value = false;
    }
  },
  { immediate: true },
);

/**
 * 加载评估任务风险等级统计数据
 * @param taskNo 评估任务编号
 */
async function loadAssessmentTaskRiskLevelStatistics(taskNo: string) {
  try {
    const response = await getAssessmentTaskRiskLevelStatistics(taskNo);
    if (!response) {
      assessmentTaskRiskLevelStatistics.value = undefined;
      return message.error('获取风险统计信息失败');
    }
    assessmentTaskRiskLevelStatistics.value = response;

    // 处理风险等级颜色
    assessmentTaskRiskLevelStatistics.value.gradeList.forEach((grade) => {
      grade.riskLevelList.forEach((riskLevel: RiskLevel) => {
        riskLevel.color = riskLevelConfigs.find(
          (config) => config.level === riskLevel.riskLevel,
        )?.color;
      });
      // 处理班级数据
      if (grade.classList) {
        grade.classList.forEach((classItem) => {
          classItem.riskLevelList?.forEach((riskLevel: RiskLevel) => {
            riskLevel.color = riskLevelConfigs.find(
              (config) => config.level === riskLevel.riskLevel,
            )?.color;
          });
        });
      }
    });
  } catch (error) {
    console.error('获取风险统计信息失败', error);
    message.error('获取风险统计信息失败，请重试');
  }
}

defineExpose({
  loadAssessmentTaskRiskLevelStatistics,
});
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

                <!-- 统一的风险等级显示 -->
                <ACollapse.Panel
                  v-for="item in riskLevelDeptList"
                  :key="item.id"
                >
                  <template #header>
                    <AssessmentCollapse
                      :item="item"
                      :show-progress="activeType === 'all'"
                      :gap="0"
                    />
                  </template>

                  <!-- 班级模式内容 -->
                  <template v-if="item.type === 'class'">
                    <AssessmentCollapse :item="item" :show-class-name="false" />
                  </template>

                  <!-- 年级模式内容 -->
                  <template v-else>
                    <div class="flex flex-col gap-4">
                      <!-- grade 模式显示年级风险等级 -->
                      <template v-if="activeType === 'grade'">
                        <AssessmentCollapse
                          :item="item"
                          :show-class-name="false"
                        />
                      </template>

                      <!-- all 模式显示班级列表 -->
                      <template v-else-if="activeType === 'all'">
                        <div
                          class="flex items-center justify-between gap-8"
                          v-for="classItem in item.classList"
                          :key="classItem.id"
                        >
                          <AssessmentCollapse :item="classItem" />
                        </div>
                      </template>
                    </div>
                  </template>
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
