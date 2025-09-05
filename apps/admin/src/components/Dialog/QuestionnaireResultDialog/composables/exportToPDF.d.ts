import type {
  AssessmentQuestionnaireResultVO,
  QuestionnaireAnswerItem,
} from '@vben/types';

export declare function exportQuestionnaireReportToPDF(params: {
  completedTime?: Date | number | string;
  questionnaireAnswer: QuestionnaireAnswerItem[];
  questionnaireResult: AssessmentQuestionnaireResultVO[];
  studentName: string;
}): Promise<void>;

export declare function formatAnswer(answer: string): string;
