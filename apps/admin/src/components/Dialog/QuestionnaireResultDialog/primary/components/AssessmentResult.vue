<script setup lang="ts">
import type { AssessmentResultVO } from '@vben/types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Popover, Table } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

const props = defineProps<{
  assessmentResult: AssessmentResultVO;
  getDimensionColor: (config: {
    isAbnormal: number;
    questionnaireName: string;
    riskLevel: number;
    type: 'bg' | 'color';
  }) => string;
}>();

const columns = [
  {
    title: '维度名称',
    dataIndex: 'name',
    width: '40%',
  },
  {
    title: '得分',
    dataIndex: 'score',
    width: '30%',
  },
  {
    title: '测评结果',
    dataIndex: 'level',
    width: '30%',
  },
];

const questionnaireResults = computed(() => {
  const results = props.assessmentResult?.questionnaireResults;

  if (!results?.length) {
    return [];
  }

  return results.map((result) => {
    if (!result.dimensions || result.dimensions.length === 0) {
      return {
        ...result,
        dimensions: [],
      };
    }

    return {
      ...result,
      dimensions: result.dimensions.map((dimension) => ({
        ...dimension,
        color: props.getDimensionColor({
          questionnaireName: result.questionnaireName,
          riskLevel: dimension.riskLevel,
          isAbnormal: dimension.isAbnormal,
          type: 'color',
        }),
      })),
    };
  });
});
</script>

<template>
  <div>
    <!-- 测评总结 -->
    <div
      class="mb-8 mt-6 flex flex-col gap-4 rounded-lg border bg-gray-50 p-4 text-sm"
    >
      <div>
        <h3 class="text-lg font-semibold text-gray-800">测评总结</h3>
      </div>

      <!-- 风险等级 -->
      <div class="flex items-center gap-3">
        <span class="font-medium text-gray-600">风险等级:</span>
        <LyTag
          tag-category-key="questionnaire_result_risk_level"
          :dict-value="assessmentResult.riskLevelIntervention.riskLevel"
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

    <div class="space-y-6">
      <div v-for="result in questionnaireResults" :key="result.questionnaireId">
        <Table
          v-if="result.dimensions.length > 0"
          bordered
          :columns="columns"
          :data-source="result.dimensions"
          :pagination="false"
        >
          <template #bodyCell="{ column, text, record }">
            <template v-if="column.dataIndex === 'level'">
              <div class="flex items-center gap-2">
                <span
                  class="text-sm leading-relaxed text-gray-700"
                  :style="{ color: record.color }"
                >
                  {{ text || '无' }}
                </span>
                <Popover
                  :content="record.description"
                  placement="right"
                  :overlay-style="{ maxWidth: '300px', wordWrap: 'break-word' }"
                >
                  <IconifyIcon icon="carbon:help" :color="record.color" />
                </Popover>
              </div>
            </template>
          </template>
          <template #title>
            <div class="font-bold">
              {{ result.questionnaireName }}
            </div>
          </template>
          <template #footer>
            <div class="flex flex-col gap-5">
              <template
                v-for="content in result.dimensions"
                :key="content.dimensionId"
              >
                <div class="space-y-2">
                  <div
                    class="flex items-center gap-2 font-bold"
                    :style="{ color: content.color }"
                  >
                    <div
                      class="h-1 w-1 rounded-full"
                      :style="{ backgroundColor: content.color }"
                    ></div>
                    {{ content.name }}
                  </div>
                  <div class="rounded-lg">
                    <span class="font-bold text-gray-600">教师建议：</span>
                    <span class="text-sm leading-relaxed text-gray-700">
                      {{ content.teacherComment }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>
