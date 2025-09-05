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

const interventionSuggestions = computed(() => {
  const parsed = JSON.parse(props.assessmentResult.interventionSuggestions);
  return parsed.sort((a: any, b: any) => a.priority - b.priority);
});
</script>

<template>
  <div>
    <AssessmentRadar
      :questionnaire-result="assessmentResult.questionnaireResults"
    />
    <div class="space-y-4">
      <div
        v-for="item in assessmentResult.questionnaireResults"
        :key="item.questionnaireId"
      >
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
    <div class="mt-6 rounded-lg border bg-gray-50 p-4">
      <div class="mb-4">
        <h3 class="mb-3 text-lg font-semibold text-gray-800">测评总结</h3>
      </div>

      <!-- 风险等级 -->
      <div class="mb-4 flex items-center">
        <span class="w-20 text-sm font-medium text-gray-600">风险等级:</span>
        <LyTag
          color-type="success"
          :tag-label="assessmentResult.riskLevelDescription"
        />
      </div>

      <!-- 评估结果 -->
      <div class="mb-4">
        <div class="mb-2 text-sm font-medium text-gray-600">评估结果:</div>
        <div class="rounded-md bg-white p-3">
          <p class="text-sm leading-relaxed text-gray-700">
            {{ assessmentResult.riskLevelIntervention.evaluation }}
          </p>
        </div>
      </div>

      <!-- 干预建议 -->
      <div>
        <div class="mb-2 text-sm font-medium text-gray-600">干预建议:</div>
        <div class="space-y-3">
          <div
            v-for="suggestion in interventionSuggestions"
            :key="suggestion.priority"
            class="rounded-md bg-white p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="bg-primary flex size-4 items-center justify-center rounded-full text-xs text-white"
                >
                  {{ suggestion.priority }}
                </span>
                <h4 class="text-sm font-semibold text-gray-800">
                  {{ suggestion.title }}
                </h4>
              </div>
              <span class="text-primary text-xs">
                {{ suggestion.timeframe }}
              </span>
            </div>
            <p class="ml-6 text-sm leading-relaxed text-gray-700">
              {{ suggestion.content }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
