<script setup lang="ts">
import type {
  AssessmentQuestionnaireResultVO,
  AssessmentResultVO,
  Question,
  QuestionnaireAnswerDataVO,
  QuestionnaireAnswerItem,
  QuestionnaireResultDataVO,
} from '@vben/types';

import type {
  MtuiUniversityQuestionnaireResult,
  MtuiUniversityResultRespVO,
} from '#/api/psychology/assessment/index';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Empty, message, Spin, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getColorConfig } from '#/api/constants';
import {
  getAssessmentQuestionnaireResult,
  getAssessmentResult,
  getAssessmentTask,
  getMtuiUniversityResults,
} from '#/api/psychology/assessment/index';
import { getAssessmentQuestionnaireQuestion } from '#/api/psychology/questionnaire/index';
import LyButton from '#/components/LyButton/index.vue';

// 小学版复用 primary 的细分组件
import AssessmentResult from './primary/components/AssessmentResult.vue';
import QuestionnaireAnswer from './primary/components/QuestionnaireAnswer.vue';
import QuestionnaireResult from './primary/components/QuestionnaireResult.vue';
import { exportQuestionnaireReportToPDF } from './primary/composables/exportToPDF';
// 大学版占位内容
import UniversityContent from './university/index.vue';

const dimensions = ref<QuestionnaireResultDataVO[]>([]);
const questionnaireAnswer = ref<QuestionnaireAnswerItem[]>([]);
const mtuiResult = ref<MtuiUniversityResultRespVO>(); /** 大学MTUI测评结果 */
const assessmentResult = ref<AssessmentResultVO>(); /** 小学MTPI测评结果 */
const queryData = ref<any>();
const completedTime = ref<number>();
const activeKey = ref('result');
const loading = ref(true);
const exportLoading = ref(false);
const questionnaireAnswerActiveKey = ref('');
const scenarioName = ref<string>('');
const tabs = ref<{ key: string; tab: string }[]>([
  { key: 'result', tab: '问卷报告' },
  { key: 'answer', tab: '答题记录' },
]);

// 场景识别
const scenarioCode = ref<string>('');
const isUniversity = computed(() => {
  const code = (scenarioCode.value || '').toUpperCase();
  return code.includes('UNIVERSITY');
});

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  fullscreenButton: false,
  fullscreen: true,
  destroyOnClose: true,
  class: 'h-full overflow-hidden',
  contentClass: 'p-0 bg-[#F7F8FB] h-full w-full overflow-hidden',
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

// 加载问卷结果
async function loadQuestionnaireResult() {
  try {
    const response = await getAssessmentQuestionnaireResult(queryData.value.id);
    if (!response) {
      message.error('获取问卷结果失败');
      return;
    }
    dimensions.value = JSON.parse(response.resultData);

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

// 加载测评结果
async function loadAssessmentResult() {
  try {
    // 获取测评详情，判定场景
    const task = await getAssessmentTask(queryData.value.taskNo);
    scenarioCode.value = task?.scenarioCode || '';
    scenarioName.value = task?.scenarioName || '';

    if (isUniversity.value) {
      // 大学MTUI专用接口
      mtuiResult.value = await getMtuiUniversityResults(
        queryData.value.taskNo,
        queryData.value.userId,
      );
      assessmentResult.value = undefined;
      dimensions.value = [];
      completedTime.value = task?.updateTime as any;
    } else {
      // 小学MTPI测评结果
      const response = await getAssessmentResult(queryData.value.id);
      if (!response) {
        message.error('获取测评结果失败，请重试');
        return;
      }
      assessmentResult.value = response;
      completedTime.value = response.updateTime;
    }

    // 排序问卷结果
    sortQuestionnaireResults();

    // 获取排序后的问卷结果
    const sortedQuestionnaireResults: (
      | AssessmentQuestionnaireResultVO
      | MtuiUniversityQuestionnaireResult
    )[] = [
      ...(assessmentResult.value?.questionnaireResults ?? []),
      ...(mtuiResult.value?.questionnaireResults ?? []),
    ];

    // 统一获取问卷题目（使用排序后的结果）
    const answersList = await Promise.all(
      sortedQuestionnaireResults.map(
        async (
          item:
            | AssessmentQuestionnaireResultVO
            | MtuiUniversityQuestionnaireResult,
        ) => {
          const merged = await getQuestionnaireQuestion(
            String(item.questionnaireId ?? ''),
            JSON.parse(item.answers),
          );
          return {
            questionnaireName: item.questionnaireName,
            questionnaireId: item.questionnaireId,
            answers: (merged as Question[]) ?? [],
          };
        },
      ),
    );
    questionnaireAnswer.value = answersList;
  } catch (error) {
    console.error('获取测评结果失败', error);
    message.error('获取测评结果失败，请重试');
  }
}

// 获取问卷题目
async function getQuestionnaireQuestion(
  questionnaireId: string,
  questionnaireAnswer: QuestionnaireAnswerDataVO[],
) {
  try {
    const response = await getAssessmentQuestionnaireQuestion(questionnaireId);
    const { success, data, message: errorMessage } = response;
    if (success) {
      // 过滤出非 description 类型的题目
      const nonDescriptionQuestions = data.filter(
        (q: any) => q.type !== 'description',
      );

      // 将答案与非 description 题目合并
      const mergedAnswers = questionnaireAnswer.map((answer, index) => {
        const question = nonDescriptionQuestions[index];
        return question ? Object.assign({}, answer, question) : answer;
      });

      // 将 description 类型的题目插入到正确的位置
      const result: any[] = [];
      let answerIndex = 0;

      data.forEach((question: any) => {
        if (question.type === 'description') {
          // description 题目直接插入，不关联答案
          result.push(question);
        } else {
          // 非 description 题目使用合并后的答案
          if (answerIndex < mergedAnswers.length) {
            result.push(mergedAnswers[answerIndex]);
            answerIndex++;
          }
        }
      });

      return result;
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

// 排序问卷结果
function sortQuestionnaireResults() {
  const allQuestionnaireResults: (
    | AssessmentQuestionnaireResultVO
    | MtuiUniversityQuestionnaireResult
  )[] = [
    ...(assessmentResult.value?.questionnaireResults ?? []),
    ...(mtuiResult.value?.questionnaireResults ?? []),
  ];

  // 按照 completedTime 升序排序
  allQuestionnaireResults.sort((a, b) => {
    const timeA = a.completedTime ?? 0;
    const timeB = b.completedTime ?? 0;
    return timeA - timeB;
  });

  // 将排序后的结果分别赋值回原对象
  if (assessmentResult.value) {
    assessmentResult.value.questionnaireResults =
      allQuestionnaireResults.filter(
        (item): item is AssessmentQuestionnaireResultVO => 'dimensions' in item,
      );
  }

  if (mtuiResult.value) {
    mtuiResult.value.questionnaireResults = allQuestionnaireResults.filter(
      (item): item is MtuiUniversityQuestionnaireResult =>
        'dimensionResults' in item,
    );
  }
}

// 导出问卷报告（仅小学版保留）
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
      completedTime: completedTime.value as any,
      studentName: queryData.value.name,
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

function getDimensionColor(config: {
  isAbnormal: number;
  questionnaireName: string;
  riskLevel: number;
  type: 'bg' | 'color';
}): string {
  const { isAbnormal, questionnaireName, riskLevel, type } = config;
  const DEFAULT_COLOR = '#666666';
  if (!questionnaireName) return DEFAULT_COLOR;
  if (questionnaireName.includes('心理健康评估')) {
    const colorMap = {
      bg: isAbnormal === 0 ? '#14E77E14' : '#FF083114',
      color: isAbnormal === 0 ? '#14E77E' : '#FF0831',
    } as const;
    return colorMap[type];
  }
  return getColorConfig({ dictValue: riskLevel, target: type }) as string;
}
</script>

<template>
  <QuestionnaireResultModal>
    <template #title>
      <div class="flex w-full items-center">
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
        <div class="ml-8 flex flex-1 items-center">
          <Tabs
            v-model:active-key="activeKey"
            class="result-tab w-full"
            centered
            :tab-bar-style="{ width: '100%' }"
          >
            <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.tab" />
            <template #rightExtra>
              <LyButton
                v-if="queryData?.taskName"
                :loading="exportLoading"
                :disabled="loading || exportLoading"
                type="success"
                size="small"
                class="ml-8"
                @click="handleExport"
              >
                {{ exportLoading ? '导出中...' : '导出' }}
              </LyButton>
            </template>
          </Tabs>
        </div>
      </div>
    </template>

    <div
      class="result-modal-content h-full w-full overflow-y-auto px-[12rem] py-8"
    >
      <div class="background-layer"></div>
      <div v-if="!loading" class="content-wrapper">
        <Transition name="fade" mode="out-in">
          <div v-if="activeKey === 'result'" class="space-y-6">
            <!-- 判断是否有测评结果或问卷结果 -->
            <template
              v-if="assessmentResult || dimensions.length > 0 || mtuiResult"
            >
              <!-- 测评结果视图 -->
              <template v-if="!queryData.questionnaireId">
                <!-- 大学版视图 -->
                <template v-if="isUniversity">
                  <UniversityContent
                    :query-data="queryData"
                    :dimensions="dimensions"
                    :mtui-result="mtuiResult"
                    :scenario-name="scenarioName"
                  />
                </template>
                <!-- 小学版视图 -->
                <template v-else-if="assessmentResult">
                  <div class="rounded-lg bg-white p-8 shadow-sm">
                    <div class="mb-6 flex items-center gap-3">
                      <div class="h-6 w-1 rounded-full bg-[#14E77E]"></div>
                      <h2 class="text-xl font-semibold text-gray-800">
                        {{
                          queryData.questionnaireName || queryData.taskName
                        }}结果分析
                      </h2>
                    </div>
                    <AssessmentResult
                      :assessment-result="assessmentResult!"
                      :get-dimension-color="getDimensionColor"
                    />
                  </div>
                </template>
              </template>
              <!-- 问卷结果视图 -->
              <template v-else>
                <div class="rounded-lg bg-white p-8 shadow-sm">
                  <div class="space-y-6">
                    <QuestionnaireResult
                      v-for="(dimension, index) in dimensions"
                      :key="index"
                      :questionnaire-name="queryData.questionnaireName"
                      :dimension="dimension"
                      :get-dimension-color="getDimensionColor"
                    />
                  </div>
                </div>
              </template>
            </template>
            <template v-else>
              <div class="flex-center mt-20">
                <Empty description="该问卷不提供测评报告，详情请查看答题记录" />
              </div>
            </template>
          </div>

          <div v-else class="mx-auto">
            <template v-if="questionnaireAnswer.length > 0">
              <!-- 答题记录卡片 - 垂直布局 -->
              <div class="rounded-lg bg-white shadow-sm">
                <Tabs
                  v-model:active-key="questionnaireAnswerActiveKey"
                  tab-position="left"
                  class="answer-tabs"
                >
                  <Tabs.TabPane
                    v-for="item in questionnaireAnswer"
                    :key="item.questionnaireId"
                    :tab="item.questionnaireName"
                  >
                    <!-- 答题内容 -->
                    <div class="py-4 pr-6">
                      <!-- 标题和答题信息 -->
                      <div class="mb-6 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="h-6 w-1 rounded-full bg-[#14E77E]"></div>
                          <h2 class="text-xl font-semibold text-gray-800">
                            {{ item.questionnaireName }}作答
                          </h2>
                        </div>
                        <div
                          class="flex items-center gap-6 text-sm text-gray-600"
                        >
                          <span class="flex items-center gap-2">
                            <span class="text-gray-500">作答人：</span>
                            <span class="font-medium text-gray-800">{{
                              queryData.name
                            }}</span>
                          </span>
                          <span class="flex items-center gap-2">
                            <span class="text-gray-500">作答时间：</span>
                            <span class="font-medium text-gray-800">
                              {{
                                dayjs(completedTime).format(
                                  'YYYY-MM-DD HH:mm:ss',
                                )
                              }}
                            </span>
                          </span>
                        </div>
                      </div>
                      <QuestionnaireAnswer :answers="item.answers" />
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </div>
            </template>
            <template v-else>
              <div class="flex-center mt-20 rounded-lg bg-white p-12 shadow-sm">
                <Empty />
              </div>
            </template>
          </div>
        </Transition>
      </div>

      <div v-if="loading" class="loading-overlay flex-center">
        <Spin size="large" />
      </div>
    </div>
  </QuestionnaireResultModal>
</template>

<style scoped lang="scss">
.result-modal-content {
  position: relative;
  background-color: #f7f8fb;

  .background-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: url('https://mindtrip-1305613707.cos.ap-guangzhou.myqcloud.com/static/result_bg.png');
    background-repeat: no-repeat;
    background-attachment: scroll;
    background-position: center top;
    background-size: 100% auto;
    opacity: 0.95;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: '';
      background: linear-gradient(
        to bottom,
        rgb(247 248 251 / 0%) 0%,
        rgb(247 248 251 / 30%) 40%,
        rgb(247 248 251 / 70%) 70%,
        rgb(247 248 251 / 95%) 100%
      );
    }
  }

  .content-wrapper {
    position: relative;
    z-index: 2;
  }

  .loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 10;
    background-color: rgb(255 255 255 / 90%);
  }
}

.result-tab {
  :deep(.ant-tabs) {
    height: 100% !important;
  }

  :deep(.ant-tabs-nav) {
    margin-bottom: 0 !important;

    .ant-tabs-nav-wrap {
      width: 100% !important;

      .ant-tabs-nav-list {
        display: flex !important;
        justify-content: center !important;
        width: 100% !important;
      }

      .ant-tabs-tab {
        display: flex !important;
        justify-content: center !important;
        width: 20% !important;

        .ant-tabs-tab-btn {
          font-size: 16px !important;
        }
      }
    }
  }

  :deep(.ant-tabs-nav::before) {
    border-bottom: 0 !important;
  }

  :deep(.ant-tabs-content) {
    height: 100% !important;
  }
}

.answer-tabs {
  min-height: 600px;

  :deep(.ant-tabs-nav) {
    width: 280px;
    padding: 16px 0;
    margin-right: 0;

    .ant-tabs-tab {
      height: auto;
      padding: 12px 20px;
      margin: 4px 0;
      text-align: left;
      word-wrap: break-word;
      white-space: normal;

      .ant-tabs-tab-btn {
        font-size: 14px;
        font-weight: 500;
        word-wrap: break-word;
        white-space: normal;
      }
    }

    .ant-tabs-tab-active {
      background-color: #f0f7ff;
    }
  }

  :deep(.ant-tabs-content-holder) {
    flex: 1;
    padding-left: 24px;
    border-left: 1px solid #f0f0f0;
  }

  :deep(.ant-tabs-tabpane) {
    padding: 0;
  }
}
</style>
