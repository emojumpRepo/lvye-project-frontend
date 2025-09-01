<script setup lang="ts">
import type {
  QuestionnaireAnswerDataVO,
  QuestionnaireResultDataVO,
} from '@vben/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getAssessmentQuestionnaireResult } from '#/api/psychology/assessment/index';
import LyButton from '#/components/LyButton/index.vue';

import QuestionnaireAnswer from './components/QuestionnaireAnswer.vue';
import QuestionnaireResult from './components/QuestionnaireResult.vue';
import { exportQuestionnaireReportToPDF } from './composables/exportToPDF.js';

const questionnaireResult = ref<QuestionnaireResultDataVO[]>();
const questionnaireAnswer = ref<QuestionnaireAnswerDataVO[]>();
const queryData = ref();
const completedTime = ref<number>();

const activeKey = ref('result');

// 导出问卷报告
const handleExport = async () => {
  if (
    !questionnaireResult.value ||
    !questionnaireAnswer.value ||
    !queryData.value
  ) {
    message.warning('暂无数据可导出');
    return;
  }

  try {
    await exportQuestionnaireReportToPDF({
      questionnaireResult: questionnaireResult.value,
      questionnaireAnswer: questionnaireAnswer.value,
      completedTime: completedTime.value,
      studentName: queryData.value.name,
      questionnaireName: queryData.value.questionnaireName,
    });
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
};

const [QuestionnaireResultModal, questionnaireResultModalApi] = useVbenModal({
  fullscreenButton: false,
  class: 'w-[900px]',
  footer: false,
  header: false,
  onOpenChange: async (open) => {
    if (open) {
      queryData.value = await questionnaireResultModalApi.getData();
      try {
        const response = await getAssessmentQuestionnaireResult(
          queryData.value.id,
        );
        questionnaireResult.value = JSON.parse(
          response.resultData,
        ) as QuestionnaireResultDataVO[];
        questionnaireAnswer.value = JSON.parse(
          response.answers,
        ) as QuestionnaireAnswerDataVO[];
        completedTime.value = response.completedTime;
      } catch (error) {
        console.error('获取问卷结果失败', error);
        message.error('获取问卷结果失败');
      }
    }
  },
});
</script>

<template>
  <QuestionnaireResultModal>
    <div class="h-[700px] p-6">
      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane key="result" tab="问卷报告">
          <div class="space-y-6">
            <!-- 问卷信息标题 -->
            <div class="mb-6 flex items-center gap-3">
              <div class="h-6 w-1 rounded-full bg-[#2C68FF]"></div>
              <h2 class="text-xl font-semibold text-gray-800">
                {{ queryData.questionnaireName }}结果分析
              </h2>
            </div>

            <!-- 维度结果展示 -->
            <div class="space-y-4">
              <QuestionnaireResult
                v-for="(item, index) in questionnaireResult"
                :key="index"
                :questionnaire-result="item"
              />
            </div>
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane key="answer" tab="答题记录">
          <div>
            <!-- 问卷信息标题 -->
            <div class="mb-6 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="h-6 w-1 rounded-full bg-[#2C68FF]"></div>
                <h2 class="text-xl font-semibold text-gray-800">
                  {{ queryData.questionnaireName }}作答
                </h2>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span> 作答人：{{ queryData.name }} </span>
                <span>
                  作答时间：{{
                    dayjs(completedTime).format('YYYY-MM-DD HH:mm:ss')
                  }}
                </span>
              </div>
            </div>

            <QuestionnaireAnswer :answers="questionnaireAnswer" />
          </div>
        </Tabs.TabPane>

        <template #rightExtra>
          <LyButton type="success" size="small" @click="handleExport">
            导出
          </LyButton>
        </template>
      </Tabs>
    </div>
  </QuestionnaireResultModal>
</template>
