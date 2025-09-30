<script setup lang="ts">
import type { AssessmentResultVO } from '@vben/types';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Popover, Table } from 'ant-design-vue';

import LyTag from '#/components/LyTag/index.vue';

const props = defineProps<{
  assessmentResult: AssessmentResultVO;
}>();

const columns = [
  {
    title: '维度名称',
    dataIndex: 'dimensionName',
    width: '40%',
  },
  {
    title: '得分',
    dataIndex: 'score',
    width: '30%',
  },
  // {
  //   title: '是否异常',
  //   dataIndex: 'isAbnormal',
  //   width: '20%',
  // },
  {
    title: '测评结果',
    dataIndex: 'level',
    width: '30%',
  },
];

const riskLevelColorType = ref<Record<number, { bg: string; text: string }>>({
  1: {
    bg: '#04DC7E14',
    text: '#04DC7E',
  },
  2: {
    bg: '#1966FF14',
    text: '#1966FF',
  },
  3: {
    bg: '#FF9C0514',
    text: '#FF9C05',
  },
  4: {
    bg: '#FF083114',
    text: '#FF0831',
  },
});

/**
 * 获取风险等级颜色
 * @param param
 */
function getRiskLevelColor({
  questionnaireName,
  riskLevel,
  isAbnormal,
  type,
}: {
  isAbnormal: number;
  questionnaireName: string;
  riskLevel: number;
  type: 'bg' | 'text';
}): string {
  const DEFAULT_COLOR = '#666666';

  // 没有问卷名称时返回默认颜色
  if (!questionnaireName) {
    return DEFAULT_COLOR;
  }

  // 心理健康评估的特殊处理
  if (questionnaireName.includes('心理健康评估')) {
    const isNormal = isAbnormal === 0;
    const colorMap = {
      bg: isNormal ? '#14E77E' : '#FF0831',
      text: isNormal ? '#14E77E' : '#FF0831',
    };
    return colorMap[type];
  }

  // 其他问卷的风险等级颜色处理
  const colorConfig = riskLevelColorType.value[riskLevel];
  return colorConfig?.[type] || DEFAULT_COLOR;
}

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

/**
 * 获取表格中的风险等级颜色
 * @param param0
 */
function getTableLevelColor({
  questionnaireName,
  isAbnormal,
  riskLevel,
}: {
  isAbnormal: number;
  questionnaireName: string;
  riskLevel: number;
}) {
  const DEFAULT_COLOR = '#666666';

  if (!questionnaireName) {
    return DEFAULT_COLOR;
  }

  if (questionnaireName.includes('心理健康评估')) {
    return isAbnormal === 0 ? '#14E77E' : '#FF0831';
  }

  return riskLevelColorType.value[riskLevel]?.text || DEFAULT_COLOR;
}

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
          tag-category-key="risk_level"
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
      <div v-for="item in questionnaireResults" :key="item.questionnaireId">
        <Table
          v-if="JSON.parse(item.reportContent).length > 0"
          bordered
          :columns="columns"
          :data-source="JSON.parse(item.reportContent)"
          :pagination="false"
        >
          <template #bodyCell="{ column, text, record }">
            <!-- <template v-if="column.dataIndex === 'isAbnormal'">
              <LyTag
                :color-type="text === 0 ? 'success' : 'error'"
                :tag-label="text === 0 ? '正常' : '异常'"
              />
            </template> -->

            <template v-if="column.dataIndex === 'level'">
              <div class="flex items-center gap-2">
                <span
                  class="text-sm leading-relaxed text-gray-700"
                  :style="{
                    color: getTableLevelColor({
                      questionnaireName: item.questionnaireName,
                      riskLevel: record.riskLevel,
                      isAbnormal: record.isAbnormal,
                    }),
                  }"
                >
                  {{ text || '无' }}
                </span>
                <Popover
                  :content="record.description"
                  placement="right"
                  :overlay-style="{ maxWidth: '300px', wordWrap: 'break-word' }"
                >
                  <IconifyIcon
                    icon="carbon:help"
                    :color="
                      getTableLevelColor({
                        questionnaireName: item.questionnaireName,
                        riskLevel: record.riskLevel,
                        isAbnormal: record.isAbnormal,
                      })
                    "
                  />
                </Popover>
              </div>
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
                    :style="{
                      color: getRiskLevelColor({
                        questionnaireName: item.questionnaireName,
                        riskLevel: content.riskLevel || 1,
                        isAbnormal: content.isAbnormal,
                        type: 'text',
                      }),
                    }"
                  >
                    <div
                      class="h-1 w-1 rounded-full"
                      :style="{
                        backgroundColor: getRiskLevelColor({
                          questionnaireName: item.questionnaireName,
                          riskLevel: content.riskLevel || 1,
                          isAbnormal: content.isAbnormal,
                          type: 'text',
                        }),
                      }"
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
