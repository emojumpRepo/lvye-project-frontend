import type { QuestionnaireAnswerDataVO } from '@vben/types';

export interface QuestionnaireResult {
  questionnaireId: number;
  questionnaireName: string;
  completedTime: number | string;
  totalScore: number;
  answers: QuestionnaireAnswerDataVO[];
}

export interface AssessmentResult {
  studentName: string;
  studentNo: string;
  className: string;
  questionnaireResults: QuestionnaireResult[];
}

/** 问卷模板，用于构建表头 */
export interface QuestionnaireTemplate {
  questionnaireId: number;
  questionnaireName: string;
  answers: QuestionnaireAnswerDataVO[];
}

/** 标签项 */
export interface TabItem {
  key: string;
  label: string;
}
