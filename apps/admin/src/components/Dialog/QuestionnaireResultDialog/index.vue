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

import { Empty, message, Tabs } from 'ant-design-vue';
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

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  class: 'w-[900px]',
  footer: false,
  header: false,
  onOpenChange: async (open) => {
    if (open) {
      loading.value = true;
      queryData.value = await questionnaireResultModalApi.getData();
      try {
        const safeParse = (raw: string, fallback: any) => {
          try {
            return JSON.parse(raw);
          } catch (error) {
            console.error('JSON 解析失败', error, raw);
            return fallback;
          }
        };

        if (queryData.value.questionnaireId) {
          const response = await getAssessmentQuestionnaireResult(
            queryData.value.id,
          );

          questionnaireResult.value = safeParse(
            response.resultData,
            [] as QuestionnaireResultDataVO[],
          );

          console.log(questionnaireResult.value);

          const parsedQuestionnaireAnswer = safeParse(
            response.answers,
            [] as QuestionnaireAnswerDataVO[],
          );

          const newQuestionnaireAnswer = await getQuestionnaireQuestion(
            queryData.value.questionnaireId,
            parsedQuestionnaireAnswer,
          );

          questionnaireAnswer.value = [
            {
              questionnaireName: queryData.value.questionnaireName,
              answers: (newQuestionnaireAnswer as Question[]) ?? [],
              questionnaireId: queryData.value.questionnaireId,
            },
          ];
          completedTime.value = response.completedTime;
        } else {
          const response = await getAssessmentResult(queryData.value.id);
          if (response) {
            assessmentResult.value = response;
            completedTime.value = response.updateTime;

            const results = assessmentResult.value.questionnaireResults;
            const answersList = await Promise.all(
              results.map(async (item: AssessmentQuestionnaireResultVO) => {
                const parsedAnswers = safeParse(
                  item.answers,
                  [] as QuestionnaireAnswerDataVO[],
                );
                const merged = await getQuestionnaireQuestion(
                  item.questionnaireId.toString(),
                  parsedAnswers,
                );
                return {
                  questionnaireName: item.questionnaireName,
                  questionnaireId: item.questionnaireId,
                  answers: (merged as Question[]) ?? [],
                };
              }),
            );
            questionnaireAnswer.value = answersList;
          }
        }
      } catch (error) {
        console.error('获取问卷结果失败', error);
        message.error('获取问卷结果失败');
      } finally {
        loading.value = false;
      }
    }
  },
  onClosed: () => {
    activeKey.value = 'result';
    questionnaireResultModalApi.close();
  },
});

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
</script>

<template>
  <QuestionnaireResultModal>
    <div class="h-[700px] overflow-hidden p-6">
      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane key="result" tab="问卷报告">
          <div class="h-full space-y-6 overflow-y-auto">
            <!-- 问卷信息标题 -->
            <div class="flex items-center gap-3">
              <div class="h-6 w-1 rounded-full bg-[#14E77E]"></div>
              <h2 class="text-xl font-semibold text-gray-800">
                {{ queryData.questionnaireName || queryData.taskName }}结果分析
              </h2>
            </div>

            <div
              v-if="
                !loading && (assessmentResult || questionnaireResult.length > 0)
              "
              class="px-4"
            >
              <template v-if="!queryData.questionnaireId && assessmentResult">
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
            <div v-else class="pt-10">
              <Empty />
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane key="answer" tab="答题记录">
          <template v-if="!loading && questionnaireAnswer.length > 0">
            <div class="h-full overflow-y-auto">
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
            </div>
          </template>
          <template v-else>
            <div class="pt-10">
              <Empty />
            </div>
          </template>
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
