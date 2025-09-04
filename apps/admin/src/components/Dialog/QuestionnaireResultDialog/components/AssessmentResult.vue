<script setup lang="ts">
import type { QuestionnaireResultDataVO } from '@vben/types';

import { Table } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

defineProps<{
  questionnaireName: string;
  questionnaireResult: QuestionnaireResultDataVO[];
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

const extraData = {
  riskLevel: 1,
  evaluate: '目前为心理健康问题的中风险人群。',
  suggestions: '建议进行心理咨询，以缓解焦虑和压力。',
};
</script>

<template>
  <div>
    <div class="space-y-4">
      <Table
        bordered
        :columns="columns"
        :data-source="questionnaireResult"
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
          <div class="font-bold">{{ questionnaireName }}</div>
        </template>
      </Table>
    </div>

    <!-- 测评总结 -->
    <div class="mt-6 rounded-lg border bg-gray-50 p-4">
      <div class="mb-4">
        <h3 class="mb-3 text-lg font-semibold text-gray-800">测评总结</h3>
      </div>

      <!-- 风险等级 -->
      <div class="mb-4 flex items-center">
        <span class="w-20 text-sm font-medium text-gray-600">风险等级:</span>
        <LyTag
          tag-category-key="questionnaire_result_risk_level"
          :dict-value="extraData.riskLevel"
        />
      </div>

      <!-- 评估结果 -->
      <div class="mb-4">
        <div class="mb-2 text-sm font-medium text-gray-600">评估结果:</div>
        <div class="rounded bg-blue-50 p-3">
          <p class="text-sm leading-relaxed text-gray-700">
            {{ extraData.evaluate }}
          </p>
        </div>
      </div>

      <!-- 建议 -->
      <div>
        <div class="mb-2 text-sm font-medium text-gray-600">专业建议:</div>
        <div class="rounded bg-green-50 p-3">
          <p class="text-sm leading-relaxed text-gray-700">
            {{ extraData.suggestions }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
