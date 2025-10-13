import type {
  AssessmentResultVO,
  Question,
  QuestionnaireAnswerDataVO,
} from '@vben/types';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { getAssessmentResult } from '#/api/psychology/assessment/index';
import { getAssessmentQuestionnaireQuestion } from '#/api/psychology/questionnaire/index';

const assessmentResult = ref<AssessmentResultVO>();
const completedTime = ref<number>();

/**
 * 加载测评结果
 */
async function loadAssessmentResult(id: string) {
  try {
    const response = await getAssessmentResult(id);
    if (!response) {
      message.error('获取测评结果失败，请重试');
      return;
    }

    assessmentResult.value = response;
    // completedTime.value = response.updateTime;
    // sortQuestionnaireResults();

    const results = assessmentResult.value.questionnaireResults;
    // const answersList = await Promise.all(
    //   results.map(async (item: AssessmentQuestionnaireResultVO) => {
    //     const merged = await getQuestionnaireQuestion(
    //       item.questionnaireId.toString(),
    //       JSON.parse(item.answers),
    //     );
    //     return {
    //       questionnaireName: item.questionnaireName,
    //       questionnaireId: item.questionnaireId,
    //       answers: (merged as Question[]) ?? [],
    //     };
    //   }),
    // );
    return assessmentResult.value;
  } catch (error) {
    console.error('获取测评结果失败', error);
    message.error('获取测评结果失败，请重试');
    return {};
  }
}

/**
 * 获取问卷题目
 * @param questionnaireId 问卷ID
 * @param questionnaireAnswer 问卷答案
 * @returns 问卷答案
 */
async function getQuestionnaireQuestion(questionnaireId: string) {
  try {
    const response = await getAssessmentQuestionnaireQuestion(questionnaireId);
    const { success, data, message: errorMessage } = response;
    if (success) {
      return data;
    } else {
      message.error(errorMessage);
      return [];
    }
  } catch (error) {
    console.error('获取问卷题目失败', error);
    message.error('获取问卷题目失败');
    return [];
  }
}

/**
 * 组合问卷题目和答案
 */
function mergeQuestionnaireQuestionAndAnswer(
  questions: Question[],
  questionnaireAnswer: QuestionnaireAnswerDataVO[],
) {
  return questionnaireAnswer.map((answer, index) => {
    const question = questions[index];
    return question ? Object.assign(answer, question) : answer;
  });
}

/**
 * 排序问卷结果
 */
function sortQuestionnaireResults(questionnairesTabs: any[] = []) {
  if (!questionnairesTabs || !assessmentResult.value) return;

  const tabOrderKeys = questionnairesTabs
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

export {
  getQuestionnaireQuestion,
  loadAssessmentResult,
  sortQuestionnaireResults,
};
