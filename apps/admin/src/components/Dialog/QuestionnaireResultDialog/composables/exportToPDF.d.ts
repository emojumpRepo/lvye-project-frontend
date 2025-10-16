import type {
  AssessmentQuestionnaireResultVO,
  QuestionnaireAnswerItem,
  RiskLevelIntervention,
} from '@vben/types';

export declare function exportQuestionnaireReportToPDF(params: {
  assessmentSummary?: RiskLevelIntervention;
  completedTime?: Date | number | string;
  includeAnswers?: boolean;
  questionnaireAnswer: QuestionnaireAnswerItem[];
  questionnaireResult: AssessmentQuestionnaireResultVO[];
  returnBlob?: boolean;
  scenarioName: string;
  studentName: string;
}): Promise<{ blob: Blob; filename: string }>;

export declare function formatAnswer(answer: string): string;
