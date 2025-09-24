<script setup lang="ts">
import type { AssessmentResultVO } from '@vben/types';

import { computed } from 'vue';

import { Table } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

const props = defineProps<{
  assessmentResult: AssessmentResultVO;
}>();

/**
 * 为特定数据源生成列配置
 */
const getColumnsForData = (data: any[]): any[] => {
  return [
    {
      title: '维度名称',
      dataIndex: 'dimensionName',
      width: '30%',
    },
    {
      title: '得分',
      dataIndex: 'score',
      width: '15%',
    },
    {
      title: '是否异常',
      dataIndex: 'isAbnormal',
      width: '15%',
    },
    {
      title: '测评结果',
      dataIndex: 'level',
      width: '15%',
    },
    {
      title: '评分规则',
      dataIndex: 'description',
      width: '25%',
      customCell: (record: any, rowIndex: number, _column: any) => {
        // 计算当前行的合并规则
        const currentEvaluation = record.evaluation;
        const sameEvaluationRows = data.filter(
          (item: any) => item.evaluation === currentEvaluation,
        );
        const firstOccurenceIndex = data.findIndex(
          (item: any) => item.evaluation === currentEvaluation,
        );

        return rowIndex === firstOccurenceIndex
          ? { rowSpan: sameEvaluationRows.length }
          : { rowSpan: 0 };
      },
    },
  ];
};

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
    <!-- <AssessmentRadar :questionnaire-result="questionnaireResults" /> -->
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

    <div class="space-y-6">
      <div v-for="item in questionnaireResults" :key="item.questionnaireId">
        <Table
          v-if="JSON.parse(item.reportContent).length > 0"
          bordered
          :columns="getColumnsForData(JSON.parse(item.reportContent))"
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

            <template v-if="column.dataIndex === 'level'">
              <span class="text-sm leading-relaxed text-gray-700">
                {{ text || '无' }}
              </span>
            </template>
          </template>
          <template #title>
            <div class="font-bold">
              {{ item.questionnaireName }}
            </div>
          </template>
          <template #footer>
            <div class="flex flex-col gap-5">
              <template
                v-for="content in JSON.parse(item.reportContent)"
                :key="content.dimensionName"
              >
                <div class="space-y-2">
                  <div
                    class="flex items-center gap-2 font-bold"
                    :class="
                      content.isAbnormal === 0
                        ? 'text-[#04DC70]'
                        : 'text-[#FF0831]'
                    "
                  >
                    <div
                      class="h-1 w-1 rounded-full"
                      :class="
                        content.isAbnormal === 0
                          ? 'bg-[#04DC70]'
                          : 'bg-[#FF0831]'
                      "
                    ></div>
                    {{ content.dimensionName }}
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
