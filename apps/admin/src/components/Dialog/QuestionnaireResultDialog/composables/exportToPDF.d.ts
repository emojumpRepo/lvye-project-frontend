import type {
  QuestionnaireAnswerItem,
  QuestionnaireResultDataVO,
} from '@vben/types';

export declare function exportQuestionnaireReportToPDF(params: {
  completedTime?: Date | number | string;
  questionnaireAnswer: QuestionnaireAnswerItem[];
  questionnaireName: string;
  questionnaireResult: QuestionnaireResultDataVO[];
  studentName: string;
}): Promise<void>;

export declare function formatAnswer(answer: string): string;
