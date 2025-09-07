<script setup lang="ts">
import type {
  AssessmentQuestionnaireResultVO,
  AssessmentResultVO,
  Question,
  QuestionnaireAnswerDataVO,
  QuestionnaireAnswerItem,
  QuestionnaireResultDataVO,
} from '@vben/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message, Spin, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

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

const questionnaireResult = ref<QuestionnaireResultDataVO[]>([]);
const questionnaireAnswer = ref<QuestionnaireAnswerItem[]>([]);
const assessmentResult = ref<AssessmentResultVO>();
const queryData = ref();
const completedTime = ref<number>();
const activeKey = ref('result');
const loading = ref(true);
const tabs = ref<{ key: string; tab: string }[]>([
  { key: 'result', tab: '问卷报告' },
  { key: 'answer', tab: '答题记录' },
]);

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  class: 'w-[900px] !h-full',
  footer: false,
  header: false,
  onOpenChange: async (open) => {
    if (open) {
      loading.value = true;
      queryData.value = await questionnaireResultModalApi.getData();
      await (queryData.value.questionnaireId
        ? loadQuestionnaireResult()
        : loadAssessmentResult());
      loading.value = false;
    }
  },
  onClosed: () => {
    activeKey.value = 'result';
    assessmentResult.value = undefined;
    questionnaireResult.value = [];
    questionnaireAnswer.value = [];
    completedTime.value = undefined;
    questionnaireResultModalApi.close();
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
    questionnaireResult.value = JSON.parse(response.resultData);

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
  if (!queryData.value?.questionnairesTabs || !assessmentResult.value) return;

  const tabOrderKeys = queryData.value.questionnairesTabs
    .map((t: { key: string }) => t.key)
    .filter((k: string) => k && k.trim() !== '');

  const orderIndexMap = new Map(
    tabOrderKeys.map((key: string, index: number) => [Number(key), index]),
  );

  // 对问卷结果进行排序
  assessmentResult.value.questionnaireResults.sort((a, b) => {
    const questionnaireIdA = Number(a.questionnaireId);
    const questionnaireIdB = Number(b.questionnaireId);

    const orderIndexA = orderIndexMap.get(questionnaireIdA);
    const orderIndexB = orderIndexMap.get(questionnaireIdB);

    if (orderIndexA !== undefined && orderIndexB !== undefined) {
      return Number(orderIndexA) - Number(orderIndexB);
    }

    if (orderIndexA !== undefined && orderIndexB === undefined) {
      return -1;
    }
    if (orderIndexA === undefined && orderIndexB !== undefined) {
      return 1;
    }

    return questionnaireIdA - questionnaireIdB;
  });
}

// 导出问卷报告
const handleExport = async () => {
  if (!queryData.value) {
    message.warning('暂无数据可导出');
    return;
  }

  try {
    await exportQuestionnaireReportToPDF({
      questionnaireResult: assessmentResult.value!.questionnaireResults,
      questionnaireAnswer: questionnaireAnswer.value,
      completedTime: completedTime.value,
      studentName: queryData.value.name,
    });
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
};
</script>

<template>
  <QuestionnaireResultModal>
    <div class="h-full overflow-hidden p-6">
      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.tab">
          <Spin :spinning="loading" class="flex-center h-full" />
          <div v-if="!loading" class="h-full overflow-y-auto">
            <!-- 问卷报告 -->
            <div v-if="tab.key === 'result'" class="space-y-6">
              <template
                v-if="assessmentResult || questionnaireResult.length > 0"
              >
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
                    <AssessmentResult :assessment-result="assessmentResult!" />
                  </template>

                  <!-- 维度结果展示 -->
                  <template v-if="queryData.questionnaireId">
                    <div class="mt-6 space-y-6">
                      <QuestionnaireResult
                        v-for="(item, index) in questionnaireResult"
                        :key="index"
                        :questionnaire-result="item"
                      />
                    </div>
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="flex-center mt-20">
                  <Empty />
                </div>
              </template>
            </div>

            <!-- 答题记录 -->
            <div v-if="tab.key === 'answer'">
              <template v-if="questionnaireAnswer.length > 0">
                <div class="mr-6 flex items-center justify-end gap-3 text-xs">
                  <span> 作答人：{{ queryData.name }} </span>
                  <span>
                    作答时间：{{
                      dayjs(completedTime).format('YYYY-MM-DD HH:mm:ss')
                    }}
                  </span>
                </div>
                <div class="space-y-8">
                  <div
                    v-for="item in questionnaireAnswer"
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
            type="success"
            size="small"
            @click="handleExport"
          >
            导出
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
