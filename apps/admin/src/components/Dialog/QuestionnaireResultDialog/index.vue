<script setup lang="ts">
import type {
  AssessmentQuestionnaireResultVO,
  AssessmentResultVO,
  Question,
  QuestionnaireAnswerDataVO,
  QuestionnaireAnswerItem,
  QuestionnaireResultDataVO,
} from '@vben/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message, Spin, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getColorConfig } from '#/api/constants';
import {
  getAssessmentQuestionnaireResult,
  getAssessmentResult,
} from '#/api/psychology/assessment/index';
import { getAssessmentQuestionnaireQuestion } from '#/api/psychology/questionnaire/index';
import LyButton from '#/components/LyButton/index.vue';

import AssessmentResult from './components/AssessmentResult.vue';
import QuestionnaireAnswer from './components/QuestionnaireAnswer.vue';
import QuestionnaireResult from './components/QuestionnaireResult.vue';
import { exportQuestionnaireReportToPDF } from './composables/exportToPDF';

const dimensions = ref<QuestionnaireResultDataVO[]>([]);
const questionnaireAnswer = ref<QuestionnaireAnswerItem[]>([]);
const assessmentResult = ref<AssessmentResultVO>();
const queryData = ref();
const completedTime = ref<number>();
const activeKey = ref('result');
const loading = ref(true);
const exportLoading = ref(false);
const questionnaireAnswerActiveKey = ref('');
const tabs = ref<{ key: string; tab: string }[]>([
  { key: 'result', tab: '问卷报告' },
  { key: 'answer', tab: '答题记录' },
]);

// 切换问卷答案
const filterQuestionnaireAnswer = computed(() => {
  return questionnaireAnswer.value.filter(
    (item) => item.questionnaireId === questionnaireAnswerActiveKey.value,
  );
});

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  destroyOnClose: true,
  class: 'h-full overflow-hidden',
  contentClass: '!bg-[#F7F8FB] box-border flex-center px-20',
  footer: false,
  closable: false,
  onOpenChange: async (open) => {
    if (open) {
      loading.value = true;
      queryData.value = await questionnaireResultModalApi.getData();
      await (queryData.value.questionnaireId
        ? loadQuestionnaireResult()
        : loadAssessmentResult());

      questionnaireAnswerActiveKey.value = (questionnaireAnswer.value[0]
        ?.questionnaireId ?? '') as string;
      loading.value = false;
    }
  },
});

/**
 * 加载问卷结果
 */
async function loadQuestionnaireResult() {
  try {
    const response = await getAssessmentQuestionnaireResult(queryData.value.id);
    if (!response) {
      message.error('获取问卷结果失败');
      return;
    }

    // 获取问卷结果
    dimensions.value = JSON.parse(response.resultData);

    // 获取问卷答案
    const newQuestionnaireAnswer = await getQuestionnaireQuestion(
      queryData.value.questionnaireId,
      JSON.parse(response.answers),
    );
    questionnaireAnswer.value = [
      {
        questionnaireName: queryData.value.questionnaireName,
        answers: (newQuestionnaireAnswer as Question[]) ?? [],
        questionnaireId: queryData.value.questionnaireId,
      },
    ];
    completedTime.value = response.completedTime;
  } catch (error) {
    console.error('获取问卷结果失败', error);
    message.error('获取问卷结果失败，请重试');
  }
}

/**
 * 加载测评结果
 */
async function loadAssessmentResult() {
  try {
    const response = await getAssessmentResult(queryData.value.id);
    if (!response) {
      message.error('获取测评结果失败，请重试');
      return;
    }

    assessmentResult.value = response;
    completedTime.value = response.updateTime;
    sortQuestionnaireResults();

    const results = assessmentResult.value.questionnaireResults;
    const answersList = await Promise.all(
      results.map(async (item: AssessmentQuestionnaireResultVO) => {
        const merged = await getQuestionnaireQuestion(
          item.questionnaireId.toString(),
          JSON.parse(item.answers),
        );
        return {
          questionnaireName: item.questionnaireName,
          questionnaireId: item.questionnaireId,
          answers: (merged as Question[]) ?? [],
        };
      }),
    );
    questionnaireAnswer.value = answersList;
  } catch (error) {
    console.error('获取测评结果失败', error);
    message.error('获取测评结果失败，请重试');
  }
}

/**
 * 获取问卷题目
 * @param questionnaireId 问卷ID
 * @param questionnaireAnswer 问卷答案
 * @returns 问卷答案
 */
async function getQuestionnaireQuestion(
  questionnaireId: string,
  questionnaireAnswer: QuestionnaireAnswerDataVO[],
) {
  try {
    const response = await getAssessmentQuestionnaireQuestion(questionnaireId);
    const { success, data, message: errorMessage } = response;
    if (success) {
      const newQuestionnaireAnswer = questionnaireAnswer.map(
        (answer, index) => {
          const question = data[index];
          return question ? Object.assign(answer, question) : answer;
        },
      );
      return newQuestionnaireAnswer;
    } else {
      message.error(errorMessage);
      return questionnaireAnswer;
    }
  } catch (error) {
    console.error('获取问卷题目失败', error);
    message.error('获取问卷题目失败');
    return questionnaireAnswer;
  }
}

/**
 * 排序问卷结果
 */
function sortQuestionnaireResults() {
  if (!assessmentResult.value) return;

  // 如果有配置的 tabs 顺序，使用配置的顺序
  if (
    queryData.value?.questionnairesTabs?.length &&
    Array.isArray(queryData.value.questionnairesTabs)
  ) {
    const tabOrderKeys = queryData.value.questionnairesTabs
      .map((t: { key: string }) => t.key)
      .filter((k: string) => k?.trim());

    // 构建排序索引映射
    const orderIndexMap = new Map(
      tabOrderKeys.map((key: string, index: number) => [Number(key), index]),
    );

    // 对问卷结果进行排序
    assessmentResult.value.questionnaireResults.sort((a, b) => {
      const questionnaireIdA = Number(a.questionnaireId);
      const questionnaireIdB = Number(b.questionnaireId);

      const orderIndexA = orderIndexMap.get(questionnaireIdA);
      const orderIndexB = orderIndexMap.get(questionnaireIdB);

      // 如果都在排序表中，按排序表顺序
      if (orderIndexA !== undefined && orderIndexB !== undefined) {
        return (orderIndexA as number) - (orderIndexB as number);
      }

      // 在排序表中的排在前面
      if (orderIndexA !== undefined) return -1;
      if (orderIndexB !== undefined) return 1;

      // 都不在排序表中，按 ID 排序
      return questionnaireIdA - questionnaireIdB;
    });
  } else {
    // 否则根据问卷名称进行默认排序
    const PRIORITY_FIRST = '心理健康评估';
    const PRIORITY_LAST = '儿童期逆境与发育情况评估';

    assessmentResult.value.questionnaireResults.sort((a, b) => {
      const aIsFirst = a.questionnaireName.includes(PRIORITY_FIRST);
      const bIsFirst = b.questionnaireName.includes(PRIORITY_FIRST);
      const aIsLast = a.questionnaireName.includes(PRIORITY_LAST);
      const bIsLast = b.questionnaireName.includes(PRIORITY_LAST);

      if (aIsFirst && !bIsFirst) return -1;
      if (!aIsFirst && bIsFirst) return 1;
      if (aIsLast && !bIsLast) return 1;
      if (!aIsLast && bIsLast) return -1;
      return 0;
    });
  }
}

// 导出问卷报告
const handleExport = async () => {
  if (!queryData.value) {
    message.warning('暂无数据可导出');
    return;
  }

  exportLoading.value = true;
  try {
    await exportQuestionnaireReportToPDF({
      assessmentSummary: assessmentResult.value!.riskLevelIntervention,
      questionnaireResult: assessmentResult.value!.questionnaireResults,
      questionnaireAnswer: questionnaireAnswer.value,
      completedTime: completedTime.value,
      studentName: queryData.value.name,
      scenarioName: assessmentResult.value?.scenarioName,
    });
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  } finally {
    exportLoading.value = false;
  }
};

function handleClose() {
  questionnaireResultModalApi.close();
}

/**
 * 获取维度颜色
 * @param config 颜色配置参数
 * @param config.isAbnormal 是否异常
 * @param config.questionnaireName 问卷名称
 * @param config.riskLevel 风险等级
 * @param config.type 颜色类型
 */
function getDimensionColor(config: {
  isAbnormal: number;
  questionnaireName: string;
  riskLevel: number;
  type: 'bg' | 'color';
}): string {
  const { isAbnormal, questionnaireName, riskLevel, type } = config;
  const DEFAULT_COLOR = '#666666';

  // 没有问卷名称时返回默认颜色
  if (!questionnaireName) {
    return DEFAULT_COLOR;
  }

  // 心理健康评估的特殊处理
  if (questionnaireName.includes('心理健康评估')) {
    const colorMap = {
      bg: isAbnormal === 0 ? '#14E77E14' : '#FF083114',
      color: isAbnormal === 0 ? '#14E77E' : '#FF0831',
    };
    return colorMap[type];
  }

  // 其他问卷的风险等级颜色处理
  return getColorConfig({ dictValue: riskLevel, target: type }) as string;
}
</script>

<template>
  <QuestionnaireResultModal>
    <template #title>
      <!-- 顶部返回与标题 -->
      <div
        class="to-[rgba(255, 255, 255, 0.8) flex w-full items-center justify-between bg-gradient-to-r from-[#FFFFFF]"
      >
        <div class="flex items-center gap-4">
          <LyButton
            type="default"
            size="middle"
            class="rounded-[4px] px-[12px]"
            @click="handleClose"
          >
            返回
          </LyButton>
        </div>
      </div>
    </template>

    <div
      class="h-full w-full overflow-hidden bg-white px-10 py-6"
      style="margin: 0 140px"
    >
      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.tab">
          <Spin :spinning="loading" class="flex-center h-full" />
          <div v-if="!loading" class="h-full overflow-y-auto">
            <!-- 问卷报告 -->
            <div v-if="tab.key === 'result'" class="space-y-6">
              <template v-if="assessmentResult || dimensions.length > 0">
                <!-- 问卷信息标题 -->
                <div class="flex items-center gap-3">
                  <div class="h-6 w-1 rounded-full bg-[#14E77E]"></div>
                  <h2 class="text-xl font-semibold text-gray-800">
                    {{
                      queryData.questionnaireName || queryData.taskName
                    }}结果分析
                  </h2>
                </div>

                <div class="px-4">
                  <template
                    v-if="!queryData.questionnaireId && assessmentResult"
                  >
                    <AssessmentResult
                      :assessment-result="assessmentResult!"
                      :get-dimension-color="getDimensionColor"
                    />
                  </template>

                  <!-- 维度结果展示 -->
                  <template v-if="queryData.questionnaireId">
                    <div class="mt-6 space-y-6">
                      <QuestionnaireResult
                        v-for="(dimension, index) in dimensions"
                        :key="index"
                        :questionnaire-name="queryData.questionnaireName"
                        :dimension="dimension"
                        :get-dimension-color="getDimensionColor"
                      />
                    </div>
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="flex-center mt-20">
                  <Empty
                    description="该问卷不提供测评报告，详情请查看答题记录"
                  />
                </div>
              </template>
            </div>

            <!-- 答题记录 -->
            <div v-if="tab.key === 'answer'">
              <template v-if="questionnaireAnswer.length > 0">
                <Tabs v-model:active-key="questionnaireAnswerActiveKey">
                  <Tabs.TabPane
                    v-for="item in questionnaireAnswer"
                    :key="item.questionnaireId"
                    :tab="item.questionnaireName"
                  />
                  <template #rightExtra>
                    <div
                      class="mr-6 flex items-center justify-end gap-3 text-xs"
                    >
                      <span> 作答人：{{ queryData.name }} </span>
                      <span>
                        作答时间：{{
                          dayjs(completedTime).format('YYYY-MM-DD HH:mm:ss')
                        }}
                      </span>
                    </div>
                  </template>
                </Tabs>

                <div class="space-y-8">
                  <div
                    v-for="item in filterQuestionnaireAnswer"
                    :key="item.questionnaireId"
                  >
                    <!-- 问卷信息标题 -->
                    <div class="mb-6 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="h-6 w-1 rounded-full bg-[#14E77E]"></div>
                        <h2 class="text-xl font-semibold text-gray-800">
                          {{ item.questionnaireName }}作答
                        </h2>
                      </div>
                    </div>

                    <QuestionnaireAnswer :answers="item.answers" />
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="mt-20">
                  <Empty />
                </div>
              </template>
            </div>
          </div>
        </Tabs.TabPane>

        <template #rightExtra>
          <LyButton
            v-if="queryData.taskName"
            :loading="exportLoading"
            :disabled="loading || exportLoading"
            type="success"
            size="small"
            @click="handleExport"
          >
            {{ exportLoading ? '导出中...' : '导出' }}
          </LyButton>
        </template>
      </Tabs>
    </div>
  </QuestionnaireResultModal>
</template>

<style scoped lang="scss">
:deep(.ant-tabs) {
  height: 100% !important;
}

:deep(.ant-tabs-content) {
  height: 100% !important;
}
</style>
