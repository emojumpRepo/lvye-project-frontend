<script setup lang="ts">
import type { AssessmentResultVO } from '@vben/types';

import { computed } from 'vue';

import { Table } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

import AssessmentRadar from './AssessmentRadar.vue';

const props = defineProps<{
  assessmentResult: AssessmentResultVO;
}>();

const columns = [
  {
    title: '维度名称',
    dataIndex: 'dimensionName',
  },
  {
    title: '得分',
    dataIndex: 'score',
  },
  {
    title: '是否异常',
    dataIndex: 'isAbnormal',
  },
];

/**
 * 计算问卷结果
 */
const questionnaireResults = computed(() => {
  const hasHealthSelfAssessment =
    props.assessmentResult.questionnaireResults.some(
      (item) => item.questionnaireId === 12,
    );
  return hasHealthSelfAssessment
    ? props.assessmentResult.questionnaireResults.filter(
        (item) => item.questionnaireId === 12,
      )
    : props.assessmentResult.questionnaireResults;
});

// 干预建议
// const interventionSuggestions = computed(() => {
//   const parsed = JSON.parse(props.assessmentResult.interventionSuggestions);
//   return parsed.sort((a: any, b: any) => a.priority - b.priority);
// });
</script>

<template>
  <div>
    <AssessmentRadar :questionnaire-result="questionnaireResults" />
    <div class="space-y-4">
      <div v-for="item in questionnaireResults" :key="item.questionnaireId">
        <Table
          bordered
          :columns="columns"
          :data-source="JSON.parse(item.reportContent)"
          :pagination="false"
        >
          <template #bodyCell="{ column, text }">
            <template v-if="column.dataIndex === 'isAbnormal'">
              <LyTag
                :color-type="text === 0 ? 'success' : 'error'"
                :tag-label="text === 0 ? '正常' : '异常'"
              />
            </template>
          </template>
          <template #title>
            <div class="font-bold">
              {{ item.questionnaireName }}
            </div>
          </template>
        </Table>
      </div>
    </div>

    <!-- 测评总结 -->
    <div
      class="mt-6 flex flex-col gap-4 rounded-lg border bg-gray-50 p-4 text-sm"
    >
      <div>
        <h3 class="text-lg font-semibold text-gray-800">测评总结</h3>
      </div>

      <!-- 风险等级 -->
      <div class="flex items-center gap-3">
        <span class="font-medium text-gray-600">风险等级:</span>
        <LyTag
          color-type="success"
          :tag-label="assessmentResult.riskLevelIntervention.riskLevelName"
        />
      </div>

      <!-- 评估标准 -->
      <div>
        <div class="mb-2 font-medium text-gray-600">维度:</div>
        <div class="rounded-md bg-white p-3">
          <p class="text-sm leading-relaxed text-gray-700">
            {{ assessmentResult.riskLevelIntervention.criteria }}
          </p>
        </div>
      </div>

      <!-- 评估结果 -->
      <div>
        <div class="mb-2 font-medium text-gray-600">测评结果:</div>
        <div class="rounded-md bg-white p-3">
          <p class="leading-relaxed text-gray-700">
            {{ assessmentResult.riskLevelIntervention.evaluation }}
          </p>
        </div>
      </div>

      <!-- 干预建议 -->
      <div>
        <div class="mb-2 font-medium text-gray-600">建议:</div>
        <div class="rounded-md bg-white p-3">
          <p class="leading-relaxed text-gray-700">
            {{ assessmentResult.riskLevelIntervention.suggestion }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
